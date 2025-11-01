import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitBugReport } from '@/services/bug.service';
import { submitSuggestion } from '@/services/suggestion.service';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'bug' | 'suggestion';

export function BugReportModal({ visible, onClose }: BugReportModalProps) {
  const { user } = useAuth();
  const { show } = useToast();
  const [activeTab, setActiveTab] = React.useState<TabType>('bug');
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
      if (activeTab === 'bug') {
        await submitBugReport({
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
          title: title.trim(),
          description: description.trim(),
        });
        show('Bug report submitted successfully. Thank you!', 'success');
      } else {
        await submitSuggestion({
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
          title: title.trim(),
          description: description.trim(),
        });
        show('Suggestion submitted successfully. Thank you!', 'success');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error(`Error submitting ${activeTab}:`, error);
      show(`Failed to submit ${activeTab === 'bug' ? 'bug report' : 'suggestion'}. Please try again.`, 'error');
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
          <Text style={styles.title}>Feedback & Reports</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'bug' 
              ? 'Help us improve by reporting any issues you encounter.'
              : 'Share your ideas and suggestions to help us make the app better.'}
          </Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'suggestion' && styles.tabActive]}
              onPress={() => {
                setActiveTab('suggestion');
                setErrors({});
              }}
            >
              <Ionicons 
                name={activeTab === 'suggestion' ? 'bulb' : 'bulb-outline'} 
                size={18} 
                color={activeTab === 'suggestion' ? '#FFF' : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'suggestion' && styles.tabTextActive]}>
                Suggestion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'bug' && styles.tabActive]}
              onPress={() => {
                setActiveTab('bug');
                setErrors({});
              }}
            >
              <Ionicons 
                name={activeTab === 'bug' ? 'bug' : 'bug-outline'} 
                size={18} 
                color={activeTab === 'bug' ? '#FFF' : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'bug' && styles.tabTextActive]}>
                Bug
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder={activeTab === 'bug' ? 'Brief description of the issue' : 'Brief description of your suggestion'}
              error={errors.title}
            />

            <View style={styles.descriptionGroup}>
              <Text style={styles.label}>Description *</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder={
                  activeTab === 'bug' 
                    ? 'Describe the bug, what happened, and steps to reproduce...'
                    : 'Describe your suggestion in detail...'
                }
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
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

