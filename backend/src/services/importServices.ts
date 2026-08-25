import Papa from 'papaparse';
import { supabase } from '../config/supabaseClient.js';
import {
  ImportSamplePreview,
  ImportCommitResponse,
  ImportError,
} from '../types/csv_import.js';
import { AnimalSpecies, AnimalSex, AnimalStatus } from '../types/animal.js';

export class ImportService {
  /**
   * Parse an uploaded CSV buffer to extract headers, sample rows, and file metadata.
   */
  public parsePreview(fileBuffer: Buffer, sampleLimit = 5): ImportSamplePreview {
    let fileContent = fileBuffer.toString('utf-8');
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }

    const parsed = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new Error(`Failed to parse CSV file: ${parsed.errors[0].message}`);
    }

    const headers = parsed.meta.fields || [];
    if (headers.length === 0) {
      throw new Error('CSV file contains no headers or valid data.');
    }

    const totalRows = parsed.data.length;
    const sampleRows = parsed.data.slice(0, sampleLimit);

    return {
      headers,
      sampleRows,
      totalRows,
      sizeBytes: fileBuffer.byteLength,
    };
  }

  /**
   * Normalize user text input for species into AnimalSpecies enum.
   */
  private normalizeSpecies(value?: string): AnimalSpecies {
    if (!value) return 'sheep';
    const v = value.toLowerCase().trim();
    if (v.includes('sheep') || v.includes('ram') || v.includes('ewe')) return 'sheep';
    if (v.includes('goat') || v.includes('buck') || v.includes('doe')) return 'goat';
    if (v.includes('cattle') || v.includes('cow') || v.includes('bull')) return 'cattle';
    if (v.includes('pig') || v.includes('swine') || v.includes('sow') || v.includes('boar')) return 'pig';
    if (v.includes('poultry') || v.includes('chicken') || v.includes('hen') || v.includes('rooster')) return 'poultry';
    if (v.includes('rabbit')) return 'rabbit';
    if (v.includes('horse') || v.includes('equine') || v.includes('mare') || v.includes('stallion')) return 'horse';
    return 'other';
  }

  /**
   * Normalize user text input for sex into AnimalSex enum.
   */
  private normalizeSex(value?: string): AnimalSex {
    if (!value) return 'female';
    const v = value.toLowerCase().trim();
    if (v === 'm' || v === 'male' || v.includes('ram') || v.includes('bull') || v.includes('buck') || v.includes('boar') || v.includes('rooster')) {
      return 'male';
    }
    return 'female';
  }

  /**
   * Normalize user text input for status into AnimalStatus enum.
   */
  private normalizeStatus(value?: string): AnimalStatus {
    if (!value) return 'active';
    const v = value.toLowerCase().trim();
    if (v.includes('sold')) return 'sold';
    if (v.includes('cull') || v.includes('dead')) return 'culled';
    return 'active';
  }

  /**
   * Process and commit mapped CSV rows into Supabase animals table.
   */
  public async commitImport(
    farmId: string,
    fileBuffer: Buffer,
    options: { columnMap: Record<string, string> }
  ): Promise<ImportCommitResponse> {
    let fileContent = fileBuffer.toString('utf-8');
    if (fileContent.charCodeAt(0) === 0xfeff) {
      fileContent = fileContent.slice(1);
    }

    const parsed = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    const columnMap = options.columnMap; // key = DB field, value = CSV Header Name
    const errors: ImportError[] = [];
    const validPayloads: any[] = [];

    // Fetch existing sheep_id values on this farm to prevent duplicate Tag ID failures
    const { data: existingAnimals } = await supabase
      .from('animals')
      .select('sheep_id')
      .eq('farm_id', farmId);
    
    const existingTagIds = new Set((existingAnimals || []).map((a) => a.sheep_id.toLowerCase()));

    parsed.data.forEach((row, index) => {
      const rowNum = index + 2; // Row 1 is header, data starts at row 2
      const rowErrors: string[] = [];

      // Extract values based on column map
      const rawSheepId = columnMap.sheep_id ? row[columnMap.sheep_id] : undefined;
      const rawBreed = columnMap.breed ? row[columnMap.breed] : undefined;
      const rawSex = columnMap.sex ? row[columnMap.sex] : undefined;
      const rawSpecies = columnMap.species ? row[columnMap.species] : undefined;
      const rawFamilyLine = columnMap.family_line ? row[columnMap.family_line] : undefined;
      const rawBirthYear = columnMap.birth_year ? row[columnMap.birth_year] : undefined;
      const rawDOB = columnMap.date_of_birth ? row[columnMap.date_of_birth] : undefined;
      const rawStatus = columnMap.status ? row[columnMap.status] : undefined;
      const rawNotes = columnMap.notes ? row[columnMap.notes] : undefined;

      if (!rawSheepId || !rawSheepId.trim()) {
        rowErrors.push('Missing required Tag ID (sheep_id).');
      } else if (existingTagIds.has(rawSheepId.trim().toLowerCase())) {
        rowErrors.push(`Tag ID "${rawSheepId.trim()}" already exists on this farm.`);
      }

      if (!rawBreed || !rawBreed.trim()) {
        rowErrors.push('Missing required breed.');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          messages: rowErrors,
          data: row,
        });
        return;
      }

      // Track newly added Tag ID in set to avoid duplicates within the same CSV batch
      const cleanSheepId = rawSheepId!.trim();
      existingTagIds.add(cleanSheepId.toLowerCase());

      let parsedBirthYear: number | null = null;
      if (rawBirthYear) {
        const yearNum = parseInt(rawBirthYear.trim(), 10);
        if (!isNaN(yearNum) && yearNum > 1900 && yearNum <= 2100) {
          parsedBirthYear = yearNum;
        }
      }

      validPayloads.push({
        farm_id: farmId,
        sheep_id: cleanSheepId,
        species: this.normalizeSpecies(rawSpecies),
        sex: this.normalizeSex(rawSex),
        breed: rawBreed!.trim(),
        family_line: rawFamilyLine?.trim() || null,
        birth_year: parsedBirthYear,
        date_of_birth: rawDOB?.trim() || null,
        status: this.normalizeStatus(rawStatus),
        notes: rawNotes?.trim() || null,
      });
    });

    let createdCount = 0;
    if (validPayloads.length > 0) {
      // Chunk bulk inserts into batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < validPayloads.length; i += BATCH_SIZE) {
        const batch = validPayloads.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('animals')
          .insert(batch)
          .select('id');

        if (error) {
          console.error('[ImportService] Batch insert error:', error.message);
          errors.push({
            row: i + 2,
            messages: [`Batch database error: ${error.message}`],
          });
        } else {
          createdCount += data?.length || batch.length;
        }
      }
    }

    return {
      createdCount,
      updatedCount: 0,
      skippedCount: errors.length,
      errorCount: errors.length,
      errors,
    };
  }
}

export const importService = new ImportService();