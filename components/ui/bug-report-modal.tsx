import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitBugReport } from '@/services/bug.service';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BugReportModal({ visible, onClose }: BugReportModalProps) {
  const { user } = useAuth();
  const { show } = useToast();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ title?: string; description?: string }>({});

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});

    // Validation
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters of description';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await submitBugReport({
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        title: title.trim(),
        description: description.trim(),
      });

      show('Bug report submitted successfully. Thank you!', 'success');
      // Reset form
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Error submitting bug report:', error);
      show('Failed to submit bug report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Report a Bug</Text>
          <Text style={styles.subtitle}>Help us improve by reporting any issues you encounter.</Text>

          <View style={styles.form}>
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of the issue"
              error={errors.title}
            />

            <View style={styles.descriptionGroup}>
              <Text style={styles.label}>Description *</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the bug, what happened, and steps to reproduce..."
                multiline
                numberOfLines={6}
                style={styles.textArea}
                error={errors.description}
              />
            </View>

            <View style={styles.actions}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="secondary"
                style={styles.cancelButton}
                disabled={loading}
              />
              <Button
                title="Submit"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  descriptionGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

