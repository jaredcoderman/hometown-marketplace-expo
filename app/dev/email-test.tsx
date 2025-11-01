import { Button } from '@/components/ui/button';
import Colors from '@/constants/Colors';
import { useToast } from '@/contexts/ToastContext';
import { sendTestEmailAPI, sendWelcomeEmailAPI } from '@/services/email-api.service';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EmailTestScreen() {
  const { show } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      show('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sendTestEmailAPI(testEmail.trim());
      if (result.success) {
        show(`Test email sent successfully! ID: ${result.id}`, 'success');
      } else {
        show(`Failed to send: ${result.error}`, 'error');
      }
    } catch (error: any) {
      show('Error: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcome = async () => {
    if (!testEmail.trim()) {
      show('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sendWelcomeEmailAPI(testEmail.trim(), 'Test User', 'buyer');
      if (result.success) {
        show(`Welcome email sent successfully! ID: ${result.id}`, 'success');
      } else {
        show(`Failed to send: ${result.error}`, 'error');
      }
    } catch (error: any) {
      show('Error: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Service Test</Text>
        <Text style={styles.subtitle}>Test your Resend email integration</Text>
      </View>

      <View style={styles.infoBadge}>
        <Text style={styles.infoBadgeText}>📧 Using Firebase Cloud Functions</Text>
        <Text style={styles.infoBadgeSubtext}>Email sending handled server-side</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Email Sending</Text>
        <Text style={styles.label}>Test Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your-email@example.com"
          value={testEmail}
          onChangeText={setTestEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          Enter an email address where you want to receive test emails
        </Text>
        
        <View style={styles.buttonRow}>
          <Button
            title="Send Test Email"
            onPress={handleSendTest}
            style={[styles.button, styles.buttonHalf]}
            loading={loading}
            disabled={loading}
          />
          <Button
            title="Send Welcome Email"
            onPress={handleSendWelcome}
            style={[styles.button, styles.buttonHalf]}
            loading={loading}
            disabled={loading}
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            • For testing, emails will be sent from "onboarding@resend.dev"
          </Text>
          <Text style={styles.infoText}>
            • Check your spam folder if you don't see the email
          </Text>
          <Text style={styles.infoText}>
            • Free tier: 3,000 emails/month
          </Text>
          <Text style={styles.infoText}>
            • See EMAIL_FUNCTIONS_SETUP.md for Cloud Functions setup
          </Text>
          <Text style={styles.infoText}>
            • Functions must be deployed: firebase deploy --only functions
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  infoBadge: {
    backgroundColor: Colors.info + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  infoBadgeText: {
    color: Colors.info,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoBadgeSubtext: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});

