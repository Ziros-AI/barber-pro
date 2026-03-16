import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';

interface FormNoticeProps {
  type?: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

export const FormNotice: React.FC<FormNoticeProps> = ({
  type = 'info',
  title,
  message,
}) => {
  const variant = {
    error: {
      icon: AlertCircle,
      color: COLORS.red,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    success: {
      icon: CheckCircle2,
      color: COLORS.green,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      borderColor: 'rgba(34, 197, 94, 0.35)',
    },
    info: {
      icon: Info,
      color: COLORS.blue,
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.35)',
    },
  }[type];

  const Icon = variant.icon;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variant.backgroundColor, borderColor: variant.borderColor },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: variant.backgroundColor }]}>
        <Icon color={variant.color} size={18} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    color: COLORS.zinc300,
    fontSize: 13,
    lineHeight: 18,
  },
});
