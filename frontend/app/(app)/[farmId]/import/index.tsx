import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useImport, ImportPreviewData, ImportCommitResult } from '../../../../hooks/useImport';

// System Target Fields for Animals Table
const SYSTEM_FIELDS = [
  { key: 'sheep_id', label: 'Tag ID / Ear Tag *', required: true },
  { key: 'breed', label: 'Breed *', required: true },
  { key: 'sex', label: 'Sex (male/female)', required: false },
  { key: 'species', label: 'Species / Type', required: false },
  { key: 'family_line', label: 'Pedigree Lineage Group', required: false },
  { key: 'birth_year', label: 'Birth Year (YYYY)', required: false },
  { key: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)', required: false },
  { key: 'status', label: 'Status (active/sold/culled)', required: false },
  { key: 'notes', label: 'Notes / Remarks', required: false },
];

export default function CSVImportScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

  const { isUploading, error, previewCsv, commitImport } = useImport(farmId);

  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const fileObj = (file as any).file
          ? (file as any).file
          : {
              uri: file.uri,
              name: file.name || 'import.csv',
              type: file.mimeType || 'text/csv',
            };
        setSelectedFile(fileObj);

        // Fetch preview
        const preview = await previewCsv(fileObj);
        setPreviewData(preview);

        // Auto-match headers to system fields
        const autoMap: Record<string, string> = {};
        SYSTEM_FIELDS.forEach((sf) => {
          const matchedHeader = preview.headers.find((h) => {
            const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanK = sf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanH.includes(cleanK) || cleanK.includes(cleanH);
          });
          if (matchedHeader) {
            autoMap[sf.key] = matchedHeader;
          }
        });

        setColumnMap(autoMap);
        setStep('mapping');
      }
    } catch (err: any) {
      console.error('[CSVImport] Pick error:', err);
    }
  };

  const handleMapChange = (dbFieldKey: string, csvHeader: string) => {
    setColumnMap((prev) => {
      const updated = { ...prev };
      if (!csvHeader) {
        delete updated[dbFieldKey];
      } else {
        updated[dbFieldKey] = csvHeader;
      }
      return updated;
    });
  };

  const handleCommit = async () => {
    if (!selectedFile) return;

    if (!columnMap.sheep_id) {
      alert('Please map the required "Tag ID / Ear Tag" column before importing.');
      return;
    }
    if (!columnMap.breed) {
      alert('Please map the required "Breed" column before importing.');
      return;
    }

    try {
      const result = await commitImport(selectedFile, columnMap);
      setCommitResult(result);
      setStep('results');
    } catch (err: any) {
      console.error('[CSVImport] Commit failed:', err);
    }
  };

  const handleBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}` as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-5">
            <TouchableOpacity
              onPress={handleBackSafe}
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
            >
              <Text className="text-xs font-bold text-farm-text">‹ Dashboard</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-xl font-bold text-farm-text">Bulk CSV Import</Text>
              <Text className="text-xs text-farm-muted">Onboarding & Inventory Import</Text>
            </View>

            <View className="w-16" />
          </View>

          {error ? (
            <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-5">
              <Text className="text-xs font-bold text-farm-danger">{error}</Text>
            </View>
          ) : null}

          {/* Step 1: Upload File */}
          {step === 'upload' ? (
            <View className="bg-farm-surface border border-farm-border rounded-3xl p-8 items-center shadow-sm">
              <View className="w-16 h-16 rounded-2xl bg-farm-primary-bg justify-center items-center mb-4">
                <Text className="text-3xl">📥</Text>
              </View>

              <Text className="text-lg font-bold text-farm-text mb-1">Upload Livestock CSV</Text>
              <Text className="text-xs text-farm-muted text-center max-w-md mb-6">
                Select your Excel or CSV file containing your existing herd records. You can map your custom column names in the next step.
              </Text>

              <TouchableOpacity
                onPress={handlePickFile}
                disabled={isUploading}
                className="bg-farm-primary px-6 py-3.5 rounded-2xl shadow-xs hover:opacity-90 flex-row items-center gap-2"
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text className="text-base">📄</Text>
                    <Text className="text-sm font-bold text-farm-inverse">Choose CSV File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Step 2: Column Mapping & Preview */}
          {step === 'mapping' && previewData ? (
            <View className="gap-5">
              {/* File Summary Card */}
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 flex-row items-center justify-between shadow-sm">
                <View>
                  <Text className="text-xs font-mono text-farm-primary font-bold">
                    File: {selectedFile?.name}
                  </Text>
                  <Text className="text-xs text-farm-muted">
                    Total Rows Detected: {previewData.totalRows}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setStep('upload')}
                  className="px-3 py-1.5 bg-farm-surface-2 border border-farm-border rounded-xl"
                >
                  <Text className="text-xs font-bold text-farm-muted">Change File</Text>
                </TouchableOpacity>
              </View>

              {/* Column Mapping Form */}
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 shadow-sm">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-4">
                  Map CSV Columns to System Fields
                </Text>

                <View className="gap-3">
                  {SYSTEM_FIELDS.map((sf) => (
                    <View
                      key={sf.key}
                      className="bg-farm-bg border border-farm-border rounded-2xl p-3 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-xs font-bold text-farm-text">{sf.label}</Text>
                        <Text className="text-[10px] text-farm-muted font-mono">System Field: {sf.key}</Text>
                      </View>

                      {/* Header Selection Chips */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-w-[55%]">
                        <View className="flex-row gap-1.5">
                          <TouchableOpacity
                            onPress={() => handleMapChange(sf.key, '')}
                            className={`px-2.5 py-1 rounded-lg border ${
                              !columnMap[sf.key] ? 'bg-farm-muted/20 border-farm-muted' : 'bg-farm-surface border-farm-border'
                            }`}
                          >
                            <Text className="text-[11px] font-semibold text-farm-muted">-- Skip --</Text>
                          </TouchableOpacity>

                          {previewData.headers.map((h) => {
                            const isMapped = columnMap[sf.key] === h;
                            return (
                              <TouchableOpacity
                                key={h}
                                onPress={() => handleMapChange(sf.key, h)}
                                className={`px-2.5 py-1 rounded-lg border ${
                                  isMapped
                                    ? 'bg-farm-primary-bg border-farm-primary'
                                    : 'bg-farm-surface border-farm-border'
                                }`}
                              >
                                <Text
                                  className={`text-[11px] font-semibold ${
                                    isMapped ? 'text-farm-primary font-bold' : 'text-farm-text'
                                  }`}
                                >
                                  {h}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                </View>

                {/* Submit Commit Action */}
                <TouchableOpacity
                  onPress={handleCommit}
                  disabled={isUploading}
                  className="bg-farm-primary p-4 rounded-2xl items-center mt-5 shadow-xs hover:opacity-90 flex-row justify-center gap-2"
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text className="text-base">🚀</Text>
                      <Text className="text-sm font-bold text-farm-inverse">
                        Confirm & Import {previewData.totalRows} Animal Records
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sample Rows Preview */}
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 shadow-sm">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-3">
                  Sample Data Preview (First 5 Rows)
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View>
                    {/* Table Header */}
                    <View className="flex-row bg-farm-surface-2 p-2 rounded-xl border border-farm-border mb-2">
                      {previewData.headers.map((h) => (
                        <Text key={h} className="w-32 text-xs font-bold text-farm-text px-2">
                          {h}
                        </Text>
                      ))}
                    </View>

                    {/* Table Rows */}
                    {previewData.sampleRows.map((r, idx) => (
                      <View key={idx} className="flex-row p-2 border-b border-farm-border/60">
                        {previewData.headers.map((h) => (
                          <Text key={h} className="w-32 text-xs text-farm-muted px-2" numberOfLines={1}>
                            {r[h] || '—'}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : null}

          {/* Step 3: Import Results Summary */}
          {step === 'results' && commitResult ? (
            <View className="gap-5">
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-6 items-center shadow-sm">
                <Text className="text-4xl mb-2">🎉</Text>
                <Text className="text-xl font-bold text-farm-text mb-1">Import Completed</Text>
                <Text className="text-xs text-farm-muted text-center mb-6">
                  Your livestock CSV has been processed and saved into your farm inventory.
                </Text>

                {/* Metrics Grid */}
                <View className="flex-row flex-wrap justify-center gap-4 w-full mb-6">
                  <View className="bg-farm-primary-bg border border-farm-primary/30 px-5 py-3 rounded-2xl items-center min-w-[120px]">
                    <Text className="text-2xl font-bold text-farm-primary">{commitResult.createdCount}</Text>
                    <Text className="text-[11px] font-semibold text-farm-primary">Successfully Added</Text>
                  </View>

                  <View className="bg-farm-danger-bg border border-farm-danger/30 px-5 py-3 rounded-2xl items-center min-w-[120px]">
                    <Text className="text-2xl font-bold text-farm-danger">{commitResult.errorCount}</Text>
                    <Text className="text-[11px] font-semibold text-farm-danger">Errors / Skipped</Text>
                  </View>
                </View>

                {/* Errors List */}
                {commitResult.errors.length > 0 ? (
                  <View className="w-full bg-farm-danger-bg/40 border border-farm-danger/20 rounded-2xl p-4 mb-6">
                    <Text className="text-xs font-bold text-farm-danger uppercase tracking-wider mb-2">
                      Validation Errors Details ({commitResult.errors.length} rows)
                    </Text>
                    {commitResult.errors.map((errItem, idx) => (
                      <View key={idx} className="mb-2 pb-2 border-b border-farm-danger/10">
                        <Text className="text-xs font-bold text-farm-text">
                          Row {errItem.row}: <Text className="text-farm-danger">{errItem.messages.join(' ')}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={() => router.replace(`/(app)/${farmId}/animals` as any)}
                  className="bg-farm-primary px-6 py-3.5 rounded-2xl shadow-xs"
                >
                  <Text className="text-sm font-bold text-farm-inverse">View Herd Inventory ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
