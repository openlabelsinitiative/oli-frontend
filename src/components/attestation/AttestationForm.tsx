// components/attestation/AttestationForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../attestation/ConfirmationModal';
import InputWithCheck from '../attestation/InputWithCheck';
import FormLabel from '../attestation/FormLabel';
import ToggleSwitch from './ToggleSwitch';
import Notification from './Notification';
import CustomDropdown from './CustomDropdown';
import { TAG_DESCRIPTIONS } from '../../constants/tagDescriptions';

// Import shared constants and utilities
import { SCHEMA_UID } from '../../constants/eas';
import { formFields, initialFormState } from '../../constants/formFields';
import { FormMode, FieldValue, NotificationType, ConfirmationData } from '../../types/attestation';
import { prepareTags, prepareEncodedData, switchToBaseNetwork, initializeEAS } from '../../utils/attestationUtils';

// Define FormDataState type that extends initialFormState with an index signature
type FormDataState = typeof initialFormState & {
  [key: string]: FieldValue;
};

interface ErrorState {
  [key: string]: string;
}

interface AttestationFormProps {
  prefilledAddress?: string;
  prefilledChainId?: string;
}

const AttestationForm: React.FC<AttestationFormProps> = ({ prefilledAddress, prefilledChainId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('simple');
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [errors, setErrors] = useState<ErrorState>({});

  // Use prefilledAddress and prefilledChainId if provided
  useEffect(() => {
    if (prefilledAddress || prefilledChainId) {
      setFormData(prev => ({
        ...prev,
        ...(prefilledAddress ? { address: prefilledAddress } : {}),
        ...(prefilledChainId ? { chain_id: prefilledChainId } : {})
      }));
    }
  }, [prefilledAddress, prefilledChainId]);

  // Filter fields based on current form mode
  const getVisibleFields = () => {
    if (formMode === 'advanced') {
      // In advanced mode, show all fields
      return formFields;
    } else {
      // In simple mode, only show 'simple' or 'both' fields
      return formFields.filter(field => {
        return field.visibility === 'both' || field.visibility === 'simple';
      });
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
  };

  const submitAttestation = async () => {
    // Create tags_json object
    const tagsObject = prepareTags(formData);
    console.log('Tags object:', tagsObject);

    const encodedData = prepareEncodedData(formData.chain_id as string, tagsObject);

    if (!window.ethereum) {
      showNotification("Please connect your wallet first", "error");
      return;
    }

    try {
      // Switch to Base network
      await switchToBaseNetwork(window.ethereum);

      // Initialize EAS
      const { eas } = await initializeEAS(window.ethereum);

      /// Submit the attestation
      const tx = await eas.attest({
        schema: SCHEMA_UID,
        data: {
          recipient: formData.address as string,
          expirationTime: BigInt(0), // Using BigInt instead of 0n
          revocable: true,
          data: encodedData,
        },
      });

      // Wait for the transaction
      const newAttestationUID = await tx.wait();

      showNotification(`Attestation created successfully! UID: ${newAttestationUID}`);

      // Reset form
      setFormData(initialFormState);

    } catch (error: any) {
      console.error('Error submitting attestation:', error);
      showNotification(error.message || "Failed to submit attestation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all visible fields
    const newErrors: ErrorState = {};
    let hasError = false;

    getVisibleFields().forEach(field => {
      if (field.validator) {
        // This line now works correctly with our improved types
        const error = field.validator(formData[field.id]);

        if (error) {
          newErrors[field.id] = error;
          hasError = true;
        }
      }
      
      // Check required fields
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    // Create tags object for preview
    const tagsObject = prepareTags(formData);

    // Set confirmation data and open modal
    setConfirmationData({
      chain_id: formData.chain_id as string,
      address: formData.address as string,
      tagsObject
    });
    setIsModalOpen(true);
  };

  const handleConfirmSubmission = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);
    await submitAttestation();
  };

  const handleChange = (fieldId: string, value: FieldValue) => {
    // If the value is null, undefined, or empty, store as empty string
    const normalizedValue = value === null || value === undefined ? '' : value;
    
    setFormData(prev => ({ ...prev, [fieldId]: normalizedValue }));
    
    // Clear errors when user changes input
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const toggleFormMode = () => {
    setFormMode(prev => prev === 'simple' ? 'advanced' : 'simple');
  };

  // Handle multiselect changes
  const handleMultiSelectChange = (fieldId: string, value: string | number | boolean, isSelected: boolean) => {
    setFormData(prev => {
      // Get current values as an array (regardless of how they're stored)
      let currentValues: Array<string | number | boolean> = [];
      
      if (prev[fieldId]) {
        // If it's already an array, use it directly
        if (Array.isArray(prev[fieldId])) {
          currentValues = prev[fieldId] as Array<string | number | boolean>;
        } 
        // If it's a comma-separated string, split it and convert to appropriate types
        else if (typeof prev[fieldId] === 'string') {
          currentValues = String(prev[fieldId])
            .split(',')
            .filter(v => v.trim() !== '')
            .map(v => {
              // No need to convert ERC strings to numbers
              // Only convert to number if it's not an ERC type and looks like a number
              const isErcType = v.includes('ERC');
              if (!isErcType) {
                const num = Number(v);
                if (!isNaN(num) && v.trim() !== '') return num;
              }
              
              // Try to convert to boolean if it's 'true' or 'false'
              if (v === 'true') return true;
              if (v === 'false') return false;
              
              // Otherwise keep as string
              return v;
            });
        }
        // If it's a single value, make it an array
        else {
          currentValues = [prev[fieldId] as (string | number | boolean)];
        }
      }
      
      let newValues: Array<string | number | boolean>;
      
      if (isSelected) {
        // Add the value if it doesn't exist (check using string comparison)
        const valueExists = currentValues.some(v => String(v) === String(value));
        newValues = valueExists ? currentValues : [...currentValues, value];
      } else {
        // Remove the value (using string comparison for safety)
        newValues = currentValues.filter(v => String(v) !== String(value));
      }
      
      // Join array back to comma-separated string to match FieldValue type
      // or use empty string if no values
      const updatedValue = newValues.length > 0 ? newValues.join(',') : '';
      
      return { ...prev, [fieldId]: updatedValue };
    });
    
    // Clear errors when user changes input
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: typeof formFields[0]) => {
    const commonInputClassName = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400 bg-gray-50 py-2 pl-3";

    // Type assertion to make tooltipKey compatible with the FormLabel props
    const tooltipKey = field.tooltipKey as keyof typeof TAG_DESCRIPTIONS;

    // Helper function to ensure string value for inputs
    const getStringValue = (value: FieldValue): string => {
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      return value?.toString() || '';
    };

    // For multiselect, get the array of selected values
    const getSelectedValues = (value: FieldValue): Array<string | number | boolean> => {
      if (!value) return [];
      
      // If it's already an array, return it
      if (Array.isArray(value)) return value;
      
      // If it's a string that might be comma-separated
      if (typeof value === 'string') {
        return value.split(',').filter(v => v.trim() !== '').map(v => {
          // Try to convert to number if it looks like one
          const num = Number(v);
          if (!isNaN(num) && v.trim() !== '') return num;
          
          // Try to convert to boolean if it's 'true' or 'false'
          if (v === 'true') return true;
          if (v === 'false') return false;
          
          // Otherwise keep as string
          return v;
        });
      }
      
      // For other types (single values) including booleans
      return [value];
    };

    return (
      <div key={field.id} className="mb-6">
        <FormLabel
          htmlFor={field.id}
          label={field.label}
          tooltipKey={tooltipKey}
        />

        <InputWithCheck
          value={formData[field.id] !== undefined && formData[field.id] !== '' && formData[field.id] !== null}
          isValid={!errors[field.id]}
          error={errors[field.id]}
        >
          {field.type === 'text' && (
            <input
              type="text"
              id={field.id}
              name={field.id}
              value={getStringValue(formData[field.id])}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={commonInputClassName}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              id={field.id}
              name={field.id}
              value={getStringValue(formData[field.id])}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={commonInputClassName}
            />
          )}

          {field.type === 'date' && (
            <input
              type="datetime-local"
              id={field.id}
              name={field.id}
              value={getStringValue(formData[field.id])}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={commonInputClassName}
              step="1" // This enables seconds selection
            />
          )}

          {field.type === 'select' && field.id === 'chain_id' && prefilledChainId ? (
            <div className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm bg-gray-50 py-2 pl-3 text-gray-700 text-sm">
              {field.options?.find(opt => opt.value === prefilledChainId)?.label || prefilledChainId}
            </div>
          ) : field.type === 'select' && (
            <div className="dropdown-wrapper" style={{ position: 'relative', zIndex: 50 }}>
              <CustomDropdown
                id={field.id}
                options={field.options || []}
                value={getStringValue(formData[field.id])}
                onChange={(value) => handleChange(field.id, value)}
                placeholder={field.placeholder || `Select ${field.label}`}
                required={field.required}
                error={errors[field.id]}
                isProjectDropdown={field.id === 'owner_project'}
              />
            </div>
          )}

          {field.type === 'multiselect' && (
            <div className="mt-1 bg-gray-50 rounded-md border border-gray-300 p-2">
              <div className="grid grid-cols-2 gap-2">
                {field.options?.map(option => {
                  const selectedValues = getSelectedValues(formData[field.id]);
                  // Use string comparison for mixed types (string/number)
                  const isChecked = selectedValues.some(value => 
                    String(value) === String(option.value)
                  );
                  
                  return (
                    <div className="flex items-center" key={String(option.value)}>
                      <input
                        type="checkbox"
                        id={`${field.id}-${option.value}`}
                        name={`${field.id}-${option.value}`}
                        checked={isChecked}
                        onChange={(e) => handleMultiSelectChange(field.id, option.value, e.target.checked)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <label htmlFor={`${field.id}-${option.value}`} className="ml-2 block text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {field.type === 'radio' && (
            <div className="flex gap-4 mt-1">
              {field.options?.map((option, index) => (
                <div className="flex items-center" key={`${field.id}-${option.value}-${index}`}>
                  <input
                    type="radio"
                    id={`${field.id}-${option.value}-${index}`}
                    name={field.id}
                    value={option.value}
                    checked={formData[field.id] === (option.value === 'true')}
                    onChange={(e) => handleChange(field.id, e.target.value === 'true')}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`${field.id}-${option.value}-${index}`} className="ml-2 block text-sm text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          )}

          {field.type === 'custom' && field.component && (
            field.component({
              value: formData[field.id],
              onChange: (value: any) => handleChange(field.id, value)
            })
          )}
        </InputWithCheck>
      </div>
    );
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex justify-end px-6 pt-6">
        <ToggleSwitch 
          isActive={formMode === 'advanced'} 
          onToggle={toggleFormMode} 
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pl-6 pb-6 pr-12 overflow-visible">
        <style jsx global>{`
          /* Ensure dropdowns can overflow their containers */
          .dropdown-wrapper {
            position: relative;
            z-index: 999 !important;
          }
          /* Add layers to properly stack dropdowns */
          form > div {
            position: relative;
            overflow: visible !important;
          }
          /* Override any parent constraints */
          .dropdown-container > div {
            position: static !important;
          }
          /* Make sure dropdown menus aren't constrained */
          .dropdown-container ul {
            position: absolute;
            z-index: 9999;
            overflow: visible;
          }
          /* Override any overflow hidden */
          #single-attestation, 
          #single-attestation > div,
          .max-w-7xl {
            overflow: visible !important;
          }
        `}</style>
        
        {getVisibleFields().map(renderField)}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center px-5 py-2.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 text-sm font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Create Attestation'
            )}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        data={confirmationData!}
      />
    </>
  );
};

export default AttestationForm;