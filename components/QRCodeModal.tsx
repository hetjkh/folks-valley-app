import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useRef } from 'react';
import { Alert, Linking, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

interface QRCodeModalProps {
  visible: boolean;
  url: string;
  username?: string;
  onClose: () => void;
}

export default function QRCodeModal({ visible, url, username, onClose }: QRCodeModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const qrRef = useRef<View>(null);

  const handleShareQR = async () => {
    try {
      await Share.share({
        message: `Check out my profile: ${url}`,
        url: url,
        title: 'My Profile QR Code',
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleSaveQR = async () => {
    if (Platform.OS === 'web') {
      // For web, show instructions
      Alert.alert('Save QR Code', 'Right-click on the QR code and select "Save image as" to download it to your computer.');
      return;
    }

    try {
      // Request permissions - only request write permission for saving
      const { status } = await MediaLibrary.requestPermissionsAsync({
        writeOnly: true,
      });
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant permission to save images to your gallery.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Capture the QR code view
      if (qrRef.current) {
        const uri = await captureRef(qrRef.current, {
          format: 'png',
          quality: 1,
        });

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        Alert.alert('Success', 'QR code saved to your gallery!');
      }
    } catch (error: any) {
      console.error('Error saving QR code:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save QR code. Please make sure you have granted storage permissions.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Profile QR Code
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          <View
            ref={qrRef}
            style={styles.qrContainer}
          >
            <QRCode
              value={url}
              size={180}
              color="#000000"
              backgroundColor="#ffffff"
            />
          </View>

          {/* URL Display */}
          <View style={styles.urlContainer}>
            <Text style={[styles.urlHint, { color: colors.textSecondary }]}>
              Scan to view profile
            </Text>
            <Text
              style={[styles.urlText, { color: colors.text }]}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {url}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border }]}
              onPress={handleShareQR}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Share
              </Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.border }]}
                onPress={handleSaveQR}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={18} color={colors.text} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  Save
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={styles.doneButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    alignSelf: 'center',
  },
  urlContainer: {
    marginBottom: 16,
  },
  urlHint: {
    fontFamily: 'Gilroy',
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  urlText: {
    fontFamily: 'Gilroy',
    fontSize: 10,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 12,
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#2563eb',
  },
  doneButtonText: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 12,
    marginTop: 4,
    color: '#ffffff',
  },
});
