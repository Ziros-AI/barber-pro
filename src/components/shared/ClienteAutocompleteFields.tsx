import React, { useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/api/supabaseClient';
import { COLORS } from '../../styles/colors';

interface ClienteSugestao {
  id: string;
  nome: string;
  telefone: string | null;
}

interface ClienteAutocompleteFieldsProps {
  visible: boolean;
  clienteNome: string;
  clienteTelefone: string;
  setClienteNome: (value: string) => void;
  setClienteTelefone: (value: string) => void;
  onClienteValidoChange?: (isValid: boolean) => void;
  inputBackgroundColor: string;
  labelNome?: string;
  labelTelefone?: string;
  nomePlaceholder?: string;
  telefonePlaceholder?: string;
  inputGroupStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const ClienteAutocompleteFields: React.FC<ClienteAutocompleteFieldsProps> = ({
  visible,
  clienteNome,
  clienteTelefone,
  setClienteNome,
  setClienteTelefone,
  onClienteValidoChange,
  inputBackgroundColor,
  labelNome = 'Nome do Cliente',
  labelTelefone = 'Telefone',
  nomePlaceholder = 'Digite o nome do cliente',
  telefonePlaceholder = 'Digite o telefone do cliente',
  inputGroupStyle,
  inputStyle,
  labelStyle,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-autocomplete'],
    enabled: visible,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as ClienteSugestao[];
    },
  });

  const clientesFiltrados = useMemo(() => {
    const nomeBusca = clienteNome.trim().toLowerCase();

    if (!nomeBusca) {
      return [];
    }

    return clientes
      .filter((cliente) => cliente.nome.toLowerCase().includes(nomeBusca))
      .slice(0, 5);
  }, [clienteNome, clientes]);

  const clienteSelecionado = useMemo(() => {
    const nomeBusca = clienteNome.trim().toLowerCase();
    const telefoneBusca = clienteTelefone.replace(/\D/g, '');

    if (!nomeBusca || !telefoneBusca) {
      return null;
    }

    return (
      clientes.find(
        (cliente) =>
          cliente.nome.trim().toLowerCase() === nomeBusca &&
          (cliente.telefone || '').replace(/\D/g, '').slice(0, 11) === telefoneBusca
      ) || null
    );
  }, [clienteNome, clienteTelefone, clientes]);

  useEffect(() => {
    onClienteValidoChange?.(Boolean(clienteSelecionado));
  }, [clienteSelecionado, onClienteValidoChange]);

  const handleClienteNomeChange = (value: string) => {
    setClienteNome(value);

    const clienteExistente = clientes.find(
      (cliente) => cliente.nome.trim().toLowerCase() === value.trim().toLowerCase()
    );

    if (clienteExistente?.telefone) {
      setClienteTelefone(clienteExistente.telefone.replace(/\D/g, '').slice(0, 11));
    }

    setShowSuggestions(value.trim().length > 0);
  };

  const handleSelectCliente = (cliente: ClienteSugestao) => {
    setClienteNome(cliente.nome);
    setClienteTelefone((cliente.telefone || '').replace(/\D/g, '').slice(0, 11));
    setShowSuggestions(false);
  };

  return (
    <>
      <View style={inputGroupStyle}>
        <Text style={labelStyle}>{labelNome}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor }, inputStyle]}
          placeholder={nomePlaceholder}
          placeholderTextColor={COLORS.zinc600}
          value={clienteNome}
          onChangeText={handleClienteNomeChange}
          onFocus={() => setShowSuggestions(clienteNome.trim().length > 0)}
        />

        {showSuggestions && clientesFiltrados.length > 0 && (
          <View style={[styles.suggestionsCard, { backgroundColor: inputBackgroundColor }]}>
            {clientesFiltrados.map((cliente, index) => (
              <TouchableOpacity
                key={cliente.id}
                style={[
                  styles.suggestionItem,
                  index === clientesFiltrados.length - 1 && styles.suggestionItemLast,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectCliente(cliente)}
              >
                <Text style={styles.suggestionName}>{cliente.nome}</Text>
                <Text style={styles.suggestionPhone}>
                  {cliente.telefone ? formatPhoneNumber(cliente.telefone) : 'Sem telefone'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {clienteNome.trim().length > 0 && clienteTelefone.trim().length > 0 && !clienteSelecionado && (
          <Text style={styles.validationText}>
            Selecione um cliente já cadastrado para continuar.
          </Text>
        )}
      </View>

      <View style={inputGroupStyle}>
        <Text style={labelStyle}>{labelTelefone}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackgroundColor }, inputStyle]}
          placeholder={telefonePlaceholder}
          placeholderTextColor={COLORS.zinc600}
          value={formatPhoneNumber(clienteTelefone)}
          onFocus={() => setShowSuggestions(false)}
          onChangeText={(value) => setClienteTelefone(value.replace(/\D/g, '').slice(0, 11))}
          keyboardType="phone-pad"
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
  },
  suggestionsCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc800,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionName: {
    color: COLORS.white,
    fontWeight: '600',
  },
  suggestionPhone: {
    color: COLORS.zinc400,
    marginTop: 4,
  },
  validationText: {
    color: COLORS.red,
    marginTop: 8,
    fontSize: 12,
  },
});
