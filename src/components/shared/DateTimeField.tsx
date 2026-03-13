import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { COLORS } from '../../styles/colors';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  inputBackgroundColor: string;
  inputBorderWidth?: number;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  inputTextStyle?: StyleProp<TextStyle>;
  pickerCardStyle?: StyleProp<ViewStyle>;
  pickerLabelStyle?: StyleProp<TextStyle>;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  value,
  onChange,
  inputBackgroundColor,
  inputBorderWidth = 1,
  containerStyle,
  labelStyle,
  inputStyle,
  inputTextStyle,
  pickerCardStyle,
  pickerLabelStyle,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time'>('date');

  const handleOpen = () => {
    if (Platform.OS === 'android') {
      setAndroidPickerMode('date');
      setShowPicker(true);
      return;
    }

    setShowPicker((current) => !current);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (!selectedValue) {
      return;
    }

    if (androidPickerMode === 'date') {
      const novaData = new Date(value);
      novaData.setFullYear(selectedValue.getFullYear(), selectedValue.getMonth(), selectedValue.getDate());
      onChange(novaData);
      setAndroidPickerMode('time');
      setShowPicker(true);
      return;
    }

    const novaData = new Date(value);
    novaData.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);
    onChange(novaData);
    setShowPicker(false);
  };

  const handleIOSDateChange = (_event: DateTimePickerEvent, selectedValue?: Date) => {
    if (!selectedValue) {
      return;
    }

    const novaData = new Date(value);
    novaData.setFullYear(selectedValue.getFullYear(), selectedValue.getMonth(), selectedValue.getDate());
    onChange(novaData);
  };

  const handleIOSTimeChange = (_event: DateTimePickerEvent, selectedValue?: Date) => {
    if (!selectedValue) {
      return;
    }

    const novaData = new Date(value);
    novaData.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);
    onChange(novaData);
  };

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: inputBackgroundColor, borderWidth: inputBorderWidth }, inputStyle]}
        activeOpacity={0.85}
        onPress={handleOpen}
      >
        <Text style={[styles.inputText, inputTextStyle]}>{format(value, 'dd/MM/yyyy HH:mm')}</Text>
      </TouchableOpacity>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker value={value} mode={androidPickerMode} is24Hour onChange={handleAndroidChange} />
      )}

      {showPicker && Platform.OS !== 'android' && (
        <View style={[styles.pickerCard, { backgroundColor: inputBackgroundColor }, pickerCardStyle]}>
          <Text style={[styles.pickerLabel, pickerLabelStyle]}>Selecione a data</Text>
          <DateTimePicker value={value} mode="date" display="inline" onChange={handleIOSDateChange} />

          <Text style={[styles.pickerLabel, pickerLabelStyle]}>Selecione o horário</Text>
          <DateTimePicker value={value} mode="time" is24Hour onChange={handleIOSTimeChange} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderColor: COLORS.zinc800,
  },
  inputText: {
    color: COLORS.white,
  },
  pickerCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  pickerLabel: {
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 8,
  },
});
