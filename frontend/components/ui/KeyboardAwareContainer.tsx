import React from 'react';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

export function KeyboardAwareContainer({
  children,
  contentContainerStyle,
  bottomOffset = 20,
  ...props
}: KeyboardAwareScrollViewProps) {
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        {...(props as ScrollViewProps)}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={contentContainerStyle}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
