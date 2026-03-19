import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { COLORS } from '../../styles/colors';

interface DateTimeFieldProps {
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleOpenDate = () => {
    setShowDatePicker((current) => !current);
    if (Platform.OS !== 'android') {
      setShowTimePicker(false);
    }
  };

  const handleOpenTime = () => {
    setShowTimePicker((current) => !current);
    if (Platform.OS !== 'android') {
      setShowDatePicker(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (!selectedValue) {
      return;
    }

    const novaData = new Date(value);
    novaData.setFullYear(selectedValue.getFullYear(), selectedValue.getMonth(), selectedValue.getDate());
    onChange(novaData);

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }

    if (!selectedValue) {
      return;
    }

    const novaData = new Date(value);
    novaData.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);
    onChange(novaData);

    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  return (
    <View style={containerStyle}>
      <View style={styles.row}>
        <View style={styles.fieldColumn}>
          <Text style={[styles.fieldLabel, labelStyle]}>Data</Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: inputBackgroundColor, borderWidth: inputBorderWidth },
              inputStyle,
            ]}
            activeOpacity={0.85}
            onPress={handleOpenDate}
          >
            <Text style={[styles.inputText, inputTextStyle]}>{format(value, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldColumn}>
          <Text style={[styles.fieldLabel, labelStyle]}>Hora</Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: inputBackgroundColor, borderWidth: inputBorderWidth },
              inputStyle,
            ]}
            activeOpacity={0.85}
            onPress={handleOpenTime}
          >
            <Text style={[styles.inputText, inputTextStyle]}>{format(value, 'HH:mm')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker value={value} mode="date" onChange={handleDateChange} />
      )}

      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker value={value} mode="time" is24Hour onChange={handleTimeChange} />
      )}

      {showDatePicker && Platform.OS !== 'android' && (
        <View style={[styles.pickerCard, { backgroundColor: inputBackgroundColor }, pickerCardStyle]}>
          <Text style={[styles.pickerLabel, pickerLabelStyle]}>Selecione a data</Text>
          <DateTimePicker value={value} mode="date" display="inline" onChange={handleDateChange} />
        </View>
      )}

      {showTimePicker && Platform.OS !== 'android' && (
        <View style={[styles.pickerCard, { backgroundColor: inputBackgroundColor }, pickerCardStyle]}>
          <DateTimePicker
            value={value}
            mode="time"
            display="spinner"
            is24Hour
            onChange={handleTimeChange}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
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
