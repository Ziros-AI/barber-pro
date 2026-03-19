import React, { createContext, useContext, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react-native';
import { COLORS } from '../../styles/colors';

type AlertVariant = 'success' | 'error' | 'info' | 'warning';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertConfig = {
  visible: boolean;
  title: string;
  message: string;
  variant: AlertVariant;
  buttons: AlertButton[];
};

type AlertContextData = {
  showAlert: (title: string, message: string, variant?: AlertVariant, buttonText?: string) => void;
  showConfirm: (title: string, message: string, buttons: AlertButton[], variant?: AlertVariant) => void;
};

const AlertContext = createContext<AlertContextData | null>(null);

const DEFAULT_CONFIG: AlertConfig = {
  visible: false,
  title: '',
  message: '',
  variant: 'info',
  buttons: []
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);

  const closeAlert = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleButtonPress = (button: AlertButton) => {
    closeAlert();
    button.onPress?.();
  };

  const value = useMemo<AlertContextData>(
    () => ({
      showAlert: (title, message, variant = 'info', buttonText = 'Fechar') => {
        setConfig({
          visible: true,
          title,
          message,
          variant,
          buttons: [{ text: buttonText }]
        });
      },
      showConfirm: (title, message, buttons, variant = 'warning') => {
        setConfig({
          visible: true,
          title,
          message,
          variant,
          buttons
        });
      }
    }),
    []
  );

  const variantMap = {
    success: {
      Icon: CheckCircle2,
      iconColor: COLORS.green,
      iconBackground: 'rgba(34, 197, 94, 0.14)'
    },
    error: {
      Icon: AlertCircle,
      iconColor: COLORS.red,
      iconBackground: 'rgba(239, 68, 68, 0.14)'
    },
    info: {
      Icon: Info,
      iconColor: COLORS.blue,
      iconBackground: 'rgba(59, 130, 246, 0.14)'
    },
    warning: {
      Icon: TriangleAlert,
      iconColor: COLORS.gold,
      iconBackground: 'rgba(212, 175, 55, 0.16)'
    }
  }[config.variant];

  return (
    <AlertContext.Provider value={value}>
      {children}

      <Modal visible={config.visible} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: variantMap.iconBackground }]}>
              <variantMap.Icon color={variantMap.iconColor} size={28} />
            </View>

            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>

            <View style={[styles.actions, config.buttons.length === 1 && styles.actionsSingle]}>
              {config.buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';

                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isDestructive
                        ? styles.buttonDestructive
                        : isCancel
                          ? styles.buttonSecondary
                          : styles.buttonPrimary,
                      config.buttons.length === 1 && styles.buttonFull
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel ? styles.buttonTextSecondary : styles.buttonTextPrimary
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }

  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    alignItems: 'center'
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    color: COLORS.zinc300,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10
  },
  actionsSingle: {
    justifyContent: 'center'
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  buttonFull: {
    flex: 0,
    minWidth: 160
  },
  buttonPrimary: {
    backgroundColor: COLORS.gold
  },
  buttonSecondary: {
    backgroundColor: COLORS.zinc800,
    borderWidth: 1,
    borderColor: COLORS.zinc700
  },
  buttonDestructive: {
    backgroundColor: COLORS.red
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800'
  },
  buttonTextPrimary: {
    color: COLORS.background
  },
  buttonTextSecondary: {
    color: COLORS.white
  }
});
