// components/attestation/BulkAttestationForm.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";
import Notification from './Notification';
import BulkConfirmationModal from './BulkConfirmationModal';
import BulkFieldSelector from './BulkFieldSelector';
import ValidationSummary from './ValidationSummary';
import { Trash2, Plus, Upload, Download, Save, X } from 'lucide-react';


// Import shared constants and utilities
import { CHAIN_OPTIONS } from '../../constants/chains';
import { getNetworkConfig, isSupportedAttestationChain } from '../../constants/eas';
import { VALID_CATEGORY_IDS } from '../../constants/categories';
import { validateAddress, validateAddressForChain, validateChain, validateCategory, validateBoolean } from '../../utils/validation';
import { prepareTags, prepareEncodedData, switchToAttestationNetwork, initializeEAS, canUseSponsoredTransaction, createSponsoredBulkAttestation, FRONTEND_ATTESTATION_RECIPIENT } from '../../utils/attestationUtils';
import { parseCaip10 } from '../../utils/caipUtils';
import { NotificationType, ConfirmationData, RowData, ColumnDefinition, AttestationResult, FieldValue, ValidationWarning } from '../../types/attestation';
import { parseAndCleanCsv } from '../../utils/csvUtils';
import { formFields } from '../../constants/formFields';

import { validateProjectField } from '../../utils/projectValidation';
import { validateCategoryField } from '../../utils/categoryValidation';
import { validatePaymasterField } from '../../utils/paymasterValidation';
import OwnerProjectInput from './OwnerProjectInput';
import { CHAINS } from '../../constants/chains';

// Dynamic wallet integration
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';



// Define initial empty row
const EMPTY_ROW: RowData = {
  chain_id: '', 
  address: '',
  contract_name: '',
  owner_project: '',
  usage_category: '',
  is_contract: '',
};

// Dummy row for template
const DUMMY_ROW: RowData = {
  chain_id: 'eip155:1',
  address: '0x1234567890123456789012345678901234567890',
  contract_name: 'Example Contract',
  owner_project: 'growthepie',
  usage_category: 'other',
  is_contract: 'true',
};

// Base columns definition
const BASE_COLUMNS: ColumnDefinition[] = [
  { 
    id: 'chain_id', 
    name: 'Chain', 
    required: true,
    validator: (value: FieldValue) => validateChain(value as string, CHAIN_OPTIONS)
  },
  { 
    id: 'address', 
    name: 'Address', 
    required: true,
    validator: (value: FieldValue) => validateAddress(value as string)
  },
  { id: 'contract_name', name: 'Contract Name', required: false },
  { 
    id: 'owner_project', 
    name: 'Owner Project', 
    required: false,
    needsCustomValidation: true
  },
  { 
    id: 'usage_category', 
    name: 'Usage Category', 
    required: false,
    validator: (value: FieldValue) => validateCategory(value as string)
  },
  { 
    id: 'is_contract', 
    name: 'Is Contract', 
    required: false,
    validator: (value: FieldValue) => validateBoolean(value as string)
  },
];

interface BulkAttestationFormProps {
  enableNetworkSelection?: boolean; // When false, always uses Base network
  selectedAttestationNetwork?: number; // Network selected at page level
}

const BulkAttestationForm: React.FC<BulkAttestationFormProps> = ({ 
  enableNetworkSelection = false, // Default to simple Base workflow
  selectedAttestationNetwork = 8453 // Default to Base
}) => {
  const [rows, setRows] = useState<RowData[]>([{ ...EMPTY_ROW }]);
  
  // Dynamic wallet integration
  const { user, primaryWallet } = useDynamicContext();
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData[] | null>(null);
  const [validProjects, setValidProjects] = useState<string[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [activeColumns, setActiveColumns] = useState<ColumnDefinition[]>(BASE_COLUMNS);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [warnings, setWarnings] = useState<{ [key: string]: ValidationWarning[] }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [isValidationMode, setIsValidationMode] = useState(false);

  // Create user-friendly error summary
  const createErrorSummary = (errors: string[]): string => {
    if (errors.length === 0) return '';
    
    // Count different types of errors
    const projectErrors = errors.filter(error => error.includes('Invalid project ID')).length;
    const addressErrors = errors.filter(error => error.includes('Invalid EVM address')).length;
    const chainErrors = errors.filter(error => error.includes('Invalid chain')).length;
    const categoryErrors = errors.filter(error => error.includes('Invalid category')).length;
    const paymasterErrors = errors.filter(error => error.includes('Invalid paymaster')).length;
    const otherErrors = errors.length - projectErrors - addressErrors - chainErrors - categoryErrors - paymasterErrors;
    
    const errorParts = [];
    if (projectErrors > 0) errorParts.push(`${projectErrors} invalid project${projectErrors !== 1 ? 's' : ''}`);
    if (addressErrors > 0) errorParts.push(`${addressErrors} invalid address${addressErrors !== 1 ? 'es' : ''}`);
    if (chainErrors > 0) errorParts.push(`${chainErrors} invalid chain${chainErrors !== 1 ? 's' : ''}`);
    if (categoryErrors > 0) errorParts.push(`${categoryErrors} invalid category${categoryErrors !== 1 ? 's' : ''}`);
    if (paymasterErrors > 0) errorParts.push(`${paymasterErrors} invalid paymaster category${paymasterErrors !== 1 ? 's' : ''}`);
    if (otherErrors > 0) errorParts.push(`${otherErrors} other error${otherErrors !== 1 ? 's' : ''}`);
    
    return `CSV imported with ${errorParts.join(', ')}. Review details below.`;
  };

  // Show notification function
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success'): void => {
    setNotification({ message, type });
  }, []);

  // Check for URL parameters to pre-fill data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const address = urlParams.get('address');
    const bulk = urlParams.get('bulk');
    const chain = urlParams.get('chain');
    const contractName = urlParams.get('contract_name');
    const usageCategory = urlParams.get('usage_category');
    const ownerProject = urlParams.get('owner_project');
    const chains = urlParams.get('chains');
    
    if (address && bulk === 'true') {
      const parsedCaip10 = parseCaip10(address);
      const resolvedAddress = parsedCaip10 ? parsedCaip10.address : address;
      const resolvedChainId = parsedCaip10?.isKnownChain ? parsedCaip10.chainId : undefined;

      // If multiple chains are specified, create multiple rows
      if (chains) {
        const chainList = chains.split(',');
        const newRows = chainList.map(chainName => {
          // Map chain names to CAIP-2 format
          const chainId = (() => {
            const chain = CHAINS.find(c => c.id.toLowerCase() === chainName.toLowerCase());
            return chain?.caip2 || 'eip155:1'; // Default to Ethereum mainnet if not found
          })();
          
          const row: RowData = {
            ...EMPTY_ROW,
            address: resolvedAddress,
            chain_id: chainId,
          };
          
          if (contractName) row.contract_name = contractName;
          if (usageCategory) row.usage_category = usageCategory;
          if (ownerProject) row.owner_project = ownerProject;
          
          // Add any tag_* parameters as additional fields
          urlParams.forEach((value, key) => {
            if (key.startsWith('tag_') && key !== 'tag_chain_id') {
              const tagKey = key.substring(4); // Remove 'tag_' prefix
              row[tagKey] = value;
            }
          });
          
          return row;
        });
        
        setRows(newRows);
        showNotification(`Pre-filled ${chainList.length} rows for address ${resolvedAddress} across multiple chains.`, 'success');
      }
      // Single chain/address pre-fill
      else {
        const row: RowData = {
          ...EMPTY_ROW,
          address: resolvedAddress
        };
        
        if (chain) {
          // Map chain name to CAIP-2 format
          const chainId = (() => {
            const matchedChain = CHAINS.find(c => c.id.toLowerCase() === chain.toLowerCase());
            return matchedChain?.caip2 || 'eip155:1'; // Default to Ethereum mainnet if not found
          })();
          row.chain_id = chainId;
        } else if (resolvedChainId) {
          row.chain_id = resolvedChainId;
        }
        
        if (contractName) row.contract_name = contractName;
        if (usageCategory) row.usage_category = usageCategory;
        if (ownerProject) row.owner_project = ownerProject;
        
        // Add any tag_* parameters as additional fields
        urlParams.forEach((value, key) => {
          if (key.startsWith('tag_') && key !== 'tag_chain_id') {
            const tagKey = key.substring(4); // Remove 'tag_' prefix
            row[tagKey] = value;
          }
        });
        
        setRows([row]);
        
        const prefilledFields = [
          chain && 'chain',
          contractName && 'contract name',
          usageCategory && 'usage category',
          ownerProject && 'owner project'
        ].filter(Boolean).join(', ');
        
        const message = prefilledFields 
          ? `Address ${resolvedAddress} pre-filled with ${prefilledFields}.`
          : `Address ${resolvedAddress} pre-filled from search. Add chain information and other details.`;
        
        showNotification(message, 'success');
      }
    }
  }, [showNotification]);
  
  // Fetch valid projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('https://api.growthepie.com/v1/labels/projects.json');
        const data = await response.json();
        
        // Extract project IDs from the response
        if (data && data.data && data.data.data) {
          // The first item in each array is the project ID
          const projectIds = data.data.data.map((item: any[]) => item[0]);
          setValidProjects(projectIds);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        showNotification('Failed to load project validation data', 'warning');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchProjects();
  }, [showNotification]);

  // Add a new empty row
  const addRow = () => {
    setRows([...rows, { ...EMPTY_ROW }]);
    // Keep validation summary open if it was open
  };

  // Delete a row by index
  const deleteRow = (index: number) => {
    if (rows.length === 1) {
      // Keep at least one row, just clear it
      setRows([{ ...EMPTY_ROW }]);
      // Clear all errors and warnings for the cleared row
      const newErrors = { ...errors };
      const newWarnings = { ...warnings };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('0-')) {
          delete newErrors[key];
        }
      });
      Object.keys(newWarnings).forEach(key => {
        if (key.startsWith('0-')) {
          delete newWarnings[key];
        }
      });
      setErrors(newErrors);
      setWarnings(newWarnings);
    } else {
      // Remove the row
      setRows(rows.filter((_, i) => i !== index));
      
      // Update error and warning indices
      const newErrors: { [key: string]: string } = {};
      const newWarnings: { [key: string]: ValidationWarning[] } = {};
      
      Object.entries(errors).forEach(([key, value]) => {
        const [rowIndexStr, field] = key.split('-');
        const rowIndex = parseInt(rowIndexStr);
        
        if (rowIndex < index) {
          // Keep errors for rows before the deleted row
          newErrors[key] = value;
        } else if (rowIndex > index) {
          // Shift down errors for rows after the deleted row
          const newKey = `${rowIndex - 1}-${field}`;
          newErrors[newKey] = value;
        }
        // Skip errors for the deleted row (rowIndex === index)
      });
      
      Object.entries(warnings).forEach(([key, value]) => {
        const [rowIndexStr, field] = key.split('-');
        const rowIndex = parseInt(rowIndexStr);
        
        if (rowIndex < index) {
          // Keep warnings for rows before the deleted row
          newWarnings[key] = value;
        } else if (rowIndex > index) {
          // Shift down warnings for rows after the deleted row
          const newKey = `${rowIndex - 1}-${field}`;
          newWarnings[newKey] = value;
        }
        // Skip warnings for the deleted row (rowIndex === index)
      });
      
      setErrors(newErrors);
      setWarnings(newWarnings);
    }
    // Keep validation summary open if it was open
  };

  // Update a specific field in a row
  const updateRow = useCallback(async (index: number, field: string, value: string) => {
    const parsedCaip10 = field === 'address' ? parseCaip10(value) : null;
    const resolvedValue = parsedCaip10 ? parsedCaip10.address : value;
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: resolvedValue };
    if (parsedCaip10?.isKnownChain) {
      newRows[index].chain_id = parsedCaip10.chainId;
    }
    setRows(newRows);

    const newErrors = { ...errors };
    const newWarnings = { ...warnings };
    const errorKey = `${index}-${field}`;
    const warningKey = `${index}-${field}`;

    delete newErrors[errorKey];
    delete newWarnings[warningKey];

    const column = activeColumns.find(col => col.id === field);
    if (column) {
      if (column.required && !resolvedValue) {
        newErrors[errorKey] = `${column.name} is required`;
      } else {
        const validationError = column.id === 'address'
          ? validateAddressForChain(resolvedValue, newRows[index].chain_id)
          : column.validator
            ? column.validator(resolvedValue)
            : null;
        if (validationError) {
          newErrors[errorKey] = validationError;
        }
      }
      
      // Note: owner_project warnings are now handled in validateRows() for the summary
    }
    
    if (parsedCaip10?.isKnownChain) {
      delete newErrors[`${index}-chain_id`];
    }
    setErrors(newErrors);
    setWarnings(newWarnings);
    
    // Keep validation summary open - it will update dynamically
  }, [rows, errors, warnings, activeColumns]);

  const handleSuggestionSelection = (rowIndex: number, field: string, suggestion: string): void => {
    updateRow(rowIndex, field, suggestion);
    const warningKey = `${rowIndex}-${field}`;
    const newWarnings = { ...warnings };
    delete newWarnings[warningKey];
    setWarnings(newWarnings);
  };

  const handleCloseValidationSummary = (): void => {
    setShowValidationSummary(false);
  };

  const handleNavigateToField = (rowIndex: number, field: string): void => {
    // Find the table row element and scroll to it
    const tableRow = document.querySelector(`[data-row-index="${rowIndex}"]`);
    if (tableRow) {
      tableRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add a temporary highlight effect
      tableRow.classList.add('bg-yellow-100', 'border-yellow-300');
      setTimeout(() => {
        tableRow.classList.remove('bg-yellow-100', 'border-yellow-300');
      }, 2000);
      
      // Focus on the specific field if possible
      const fieldInput = tableRow.querySelector(`[data-field="${field}"] input`);
      if (fieldInput) {
        (fieldInput as HTMLElement).focus();
      }
    }
  };

  // Validate all rows before submission
  const validateRows = async () => {
    const newErrors: { [key: string]: string } = {};
    const newWarnings: { [key: string]: ValidationWarning[] } = {};
    let isValid = true;

    for (const [rowIndex, row] of rows.entries()) {
      // Skip empty rows
      if (Object.values(row).every(value => !value) && rows.length > 1) {
        continue;
      }

      // Check each column
      for (const column of activeColumns) {
        const value = row[column.id];
        const errorKey = `${rowIndex}-${column.id}`;
        const warningKey = `${rowIndex}-${column.id}`;

        // Check required fields
        if (column.required && !value) {
          newErrors[errorKey] = `${column.name} is required`;
          isValid = false;
          continue;
        }

        // Skip validation if field is empty and not required
        if (!value && !column.required) {
          continue;
        }

        // Run field-specific validation
        const validationError = column.id === 'address'
          ? validateAddressForChain(value, row.chain_id)
          : column.validator
            ? column.validator(value)
            : null;
        if (validationError) {
          newErrors[errorKey] = validationError;
          isValid = false;
        }

        // Special validation for owner_project
        if (column.id === 'owner_project' && value && validProjects.length > 0) {
          if (!validProjects.includes(value)) {
            // Get warnings for potential typos
            const projectWarnings = await validateProjectField(column.id, value, true);
            if (projectWarnings.length > 0) {
              // Separate actual errors from other warnings
              const actualErrors = projectWarnings.filter(w => w.isError);
              const otherWarnings = projectWarnings.filter(w => !w.isError);
              
              // Add other warnings (like similarity warnings)
              if (otherWarnings.length > 0) {
                newWarnings[warningKey] = (newWarnings[warningKey] || []).concat(otherWarnings);
              }
              
              // Add project errors as errors (but preserve suggestions for quick-fix)
              if (actualErrors.length > 0) {
                const errorMessage = actualErrors[0].message;
                newErrors[errorKey] = errorMessage;
                // Also add to warnings to preserve quick-fix suggestions in ValidationSummary
                newWarnings[warningKey] = (newWarnings[warningKey] || []).concat(actualErrors);
                isValid = false;
              }
            } else {
              newErrors[errorKey] = `Unknown project: "${value}"`;
              isValid = false;
            }
          }
        }

        // Special validation for usage_category
        if (column.id === 'usage_category' && value) {
          const categoryWarnings = await validateCategoryField(column.id, value);
          if (categoryWarnings.length > 0) {
            // Separate conversions (warnings) from actual errors
            const conversions = categoryWarnings.filter(w => w.isConversion);
            const actualErrors = categoryWarnings.filter(w => !w.isConversion);
            
            // Add conversions as warnings
            if (conversions.length > 0) {
              newWarnings[warningKey] = conversions;
            }
            
            // Add invalid categories as errors (but preserve suggestions for quick-fix)
            if (actualErrors.length > 0) {
              const errorMessage = actualErrors[0].message;
              newErrors[errorKey] = errorMessage;
              // Also add to warnings to preserve quick-fix suggestions in ValidationSummary
              newWarnings[warningKey] = (newWarnings[warningKey] || []).concat(actualErrors);
              isValid = false;
            }
          }
        }

        // Special validation for paymaster_category
        if (column.id === 'paymaster_category' && value) {
          const paymasterWarnings = await validatePaymasterField(column.id, value);
          if (paymasterWarnings.length > 0) {
            // Separate conversions (warnings) from actual errors
            const conversions = paymasterWarnings.filter(w => w.isConversion);
            const actualErrors = paymasterWarnings.filter(w => !w.isConversion);
            
            // Add conversions as warnings
            if (conversions.length > 0) {
              newWarnings[warningKey] = conversions;
            }
            
            // Add invalid paymaster categories as errors (but preserve suggestions for quick-fix)
            if (actualErrors.length > 0) {
              const errorMessage = actualErrors[0].message;
              newErrors[errorKey] = errorMessage;
              // Also add to warnings to preserve quick-fix suggestions in ValidationSummary
              newWarnings[warningKey] = (newWarnings[warningKey] || []).concat(actualErrors);
              isValid = false;
            }
          }
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return isValid;
  };



  // Prepare confirmation data for modal
  const prepareConfirmationData = () => {
    // Filter out empty rows for confirmation
    const validRows = rows.filter(row => row.address.trim() !== '');
    
    if (validRows.length === 0) return [];
    
    // Create an array of data for each row
    return validRows.map(row => {
      // Extract tags for this row
      const tagsObject = prepareTags(row);
      
      return {
        chain_id: row.chain_id,
        address: row.address,
        tagsObject
      };
    });
  };

  // Check if a row is the dummy example row
  const isDummyRow = (row: RowData): boolean => {
    // Check if the address matches the dummy row
    // We specifically check the address since it's a required field
    return row.address === DUMMY_ROW.address;
  };

  // Handle submission request
  const handleSubmissionRequest = async (e: React.FormEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    const isValid = await validateRows();
    
    // Check if there are any errors or warnings (excluding conversions)
    const hasErrors = Object.keys(errors).length > 0;
    const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
      warningList.some(w => !w.isConversion)
    );
    
    // Always show validation summary to provide feedback
    setIsValidationMode(true);
    setShowValidationSummary(true);
    
    if (!isValid || hasErrors || hasRealWarnings) {
      return; // Stop here if there are issues
    }

    // Filter out empty rows and dummy rows
    const validRows = rows.filter((row: RowData) => 
      row.address.trim() !== '' && !isDummyRow(row)
    );

    if (validRows.length === 0) {
      showNotification("Please add at least one valid address", "error");
      return;
    }

    // Check if we exceed the maximum allowed number of attestations
    if (validRows.length > 50) {
      showNotification(`You can only submit up to 50 attestations at once. You currently have ${validRows.length} valid rows.`, "error");
      return;
    }

    // Debug: Log connection state
    console.log('Dynamic connection state (bulk):', {
      user: !!user,
      primaryWallet: !!primaryWallet,
      walletAddress: primaryWallet?.address,
      walletConnector: primaryWallet?.connector?.name
    });

    // Check if Dynamic wallet is connected (in connect-only mode, user might be null)
    if (!primaryWallet) {
      showNotification("Please connect your wallet first", "error");
      return;
    }

    // Verify it's an Ethereum wallet
    if (!isEthereumWallet(primaryWallet)) {
      showNotification("Please connect an Ethereum wallet", "error");
      return;
    }

    // Prepare confirmation data and open modal
    const modalData: ConfirmationData[] = prepareConfirmationData();
    setConfirmationData(modalData);
    setIsModalOpen(true);
  };

  // Handle actual submission after confirmation
  const handleBulkSubmit = async () => {
    // Close modal
    setIsModalOpen(false);
    setIsSubmitting(true);
    
    try {
      // Check if Dynamic wallet is connected (in connect-only mode, user might be null)
      if (!primaryWallet) {
        showNotification("Please connect your wallet first", "error");
        setIsSubmitting(false);
        return;
      }

      // Verify it's an Ethereum wallet
      if (!isEthereumWallet(primaryWallet)) {
        showNotification("Please connect an Ethereum wallet", "error");
        setIsSubmitting(false);
        return;
      }

      // Determine which network to use
      // In advanced mode: use the network selected at page level
      // In simple mode: always use Base Mainnet
      const targetNetworkId = enableNetworkSelection ? selectedAttestationNetwork : 8453;
      
      // Validate that the target network is supported
      if (!isSupportedAttestationChain(targetNetworkId)) {
        throw new Error(`Unsupported network for attestations: ${targetNetworkId}`);
      }
      
      const networkConfig = getNetworkConfig(targetNetworkId);
      
      // Switch to the selected attestation network using Dynamic
      await switchToAttestationNetwork(primaryWallet, targetNetworkId);

      // Prepare attestation data
      interface AttestationData {
        recipient: string;
        expirationTime: bigint;
        revocable: boolean;
        data: string;
      }
      
      const attestationsData: AttestationData[] = [];
      const attestationTargets: string[] = [];
      
      // Filter valid rows again to be safe and exclude dummy rows
      const validRows = rows.filter(row => 
        row.address.trim() !== '' && !isDummyRow(row)
      );
      
      for (const row of validRows) {
        // Create tags_json object
        const tagsObject = prepareTags(row);
        const encodedData = prepareEncodedData(
          row.chain_id,
          row.address,
          tagsObject,
          targetNetworkId
        );

        // Add to attestations array
        attestationsData.push({
          recipient: FRONTEND_ATTESTATION_RECIPIENT,
          expirationTime: NO_EXPIRATION, 
          revocable: true,
          data: encodedData,
        });
        attestationTargets.push(row.address);
      }

      // Check if we can use sponsored transactions
      const canUseSponsored = await canUseSponsoredTransaction(primaryWallet);

      let attestationUIDs;

      if (canUseSponsored) {
        try {
          // Try sponsored bulk transaction first
          const result = await createSponsoredBulkAttestation(
            primaryWallet,
            attestationsData,
            networkConfig.schemaUID,
            targetNetworkId
          );
          
          attestationUIDs = result; // This might be different format for sponsored tx
        } catch (sponsoredError) {
          console.warn('Sponsored bulk transaction failed, falling back to regular transaction:', sponsoredError);
          
          // Fall back to regular transaction
          const { eas } = await initializeEAS(primaryWallet, targetNetworkId);
          const tx = await eas.multiAttest([
            {
              schema: networkConfig.schemaUID,
              data: attestationsData,
            }
          ]);
          
          attestationUIDs = await tx.wait();
        }
      } else {
        // Use regular transaction
        const { eas } = await initializeEAS(primaryWallet, targetNetworkId);
        const tx = await eas.multiAttest([
          {
            schema: networkConfig.schemaUID,
            data: attestationsData,
          }
        ]);
        
        attestationUIDs = await tx.wait();
      }
      
      // Create results array for user feedback
      const results: AttestationResult[] = attestationUIDs.map((uid: string, index: number) => ({
        address: attestationTargets[index],
        success: true,
        uid: uid
      }));

      // Show results summary
      const successCount = results.filter(r => r.success).length;
      showNotification(`${successCount} of ${results.length} attestations created successfully on ${networkConfig.name}!`);
      
      // Reset form if all were successful
      if (successCount === results.length) {
        setRows([{ ...EMPTY_ROW }]);
      }

    } catch (error: any) {
      console.error('Error submitting attestations:', error);
      
      // Handle specific error types
      let errorMessage = "Failed to submit attestations";
      if (error.message?.includes('User rejected')) {
        errorMessage = "Transaction was rejected by user";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('gas')) {
        errorMessage = "Insufficient gas or gas estimation failed";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const { rows: newRows, columns: newColumns, warnings: newWarnings, errors: parseErrors, conversions } = await parseAndCleanCsv(csvText, EMPTY_ROW);

      setRows(newRows);
      
      // Add conversions as special warnings
      const allWarnings = { ...newWarnings };
      Object.entries(conversions).forEach(([key, conversion]) => {
        allWarnings[key] = allWarnings[key] || [];
        allWarnings[key].push({
          message: `Chain ID converted: "${conversion.original}" → ${conversion.converted}`,
          isConversion: true
        });
      });
      
      setWarnings(allWarnings);

      // Show validation summary immediately after import to display warnings and conversions
      setIsValidationMode(false);
      setShowValidationSummary(true);

      if (parseErrors.length > 0) {
        // Create a user-friendly error summary instead of listing all errors
        const errorSummary = createErrorSummary(parseErrors);
        showNotification(errorSummary, 'error');
      } else {
        // Count different types of conversions and warnings
        const chainConversions = Object.values(conversions).filter(c => c.field === 'Chain ID').length;
        const categoryConversions = Object.values(conversions).filter(c => c.field === 'Usage Category').length;
        const paymasterConversions = Object.values(conversions).filter(c => c.field === 'Paymaster Category').length;
        const totalWarnings = Object.values(allWarnings).flat().length;
        
        // Build a simplified notification message
        const conversionParts = [];
        if (chainConversions > 0) conversionParts.push(`${chainConversions} chain ID${chainConversions !== 1 ? 's' : ''}`);
        if (categoryConversions > 0) conversionParts.push(`${categoryConversions} category${categoryConversions !== 1 ? 's' : ''}`);
        if (paymasterConversions > 0) conversionParts.push(`${paymasterConversions} paymaster category${paymasterConversions !== 1 ? 's' : ''}`);
        
        let notificationMessage = '';
        if (conversionParts.length > 0) {
          notificationMessage = `CSV imported successfully with ${conversionParts.join(', ')} converted.`;
        } else if (totalWarnings > 0) {
          notificationMessage = `CSV imported successfully with ${totalWarnings} validation warning${totalWarnings !== 1 ? 's' : ''}.`;
        } else {
          notificationMessage = 'CSV file imported successfully.';
        }
        
        notificationMessage += ' Review details below.';
        showNotification(notificationMessage, 'success');
      }

      if (newRows.length > 50) {
        showNotification(`You can only import up to 50 attestations at once. The CSV file has ${newRows.length} rows.`, "error");
        setRows(newRows.slice(0, 50));
        return;
      }
      
      setActiveColumns(newColumns);
    };

    reader.readAsText(file);
    
    // Reset file input to allow re-uploading the same file
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    // Filter out empty rows
    const rowsToExport = rows.filter(row => Object.values(row).some(value => value));
    
    if (rowsToExport.length === 0) {
      showNotification('No data to export', 'warning');
      return;
    }

    try {
      // Create CSV header and data rows
      const csvContent = [
        activeColumns.map(col => col.name).join(','),
        ...rowsToExport.map(row => 
          activeColumns.map(col => {
            const value = row[col.id] || '';
            // Escape commas and quotes in values
            return value.includes(',') || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bulk_attestation.csv';
      link.click();
      
      showNotification('CSV file exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showNotification('Error exporting CSV file', 'error');
    }
  };

  // Handle template download
  const handleDownloadTemplate = () => {
    try {
      // Create template CSV with headers and dummy row
      const csvContent = [
        activeColumns.map(col => col.name).join(','),
        activeColumns.map(col => {
          const value = DUMMY_ROW[col.id] || '';
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bulk_attestation_template.csv';
      link.click();
      
      showNotification('Template downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      showNotification('Error downloading template', 'error');
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Check if a column is removable
  const isColumnRemovable = (columnId: string) => {
    const nonRemovableFields = ['chain_id', 'address'];
    return !nonRemovableFields.includes(columnId);
  };

  // Add a new field to the table
  const handleAddField = (fieldId: string) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;

    // Add the field to columns
    const newColumn: ColumnDefinition = {
      id: field.id,
      name: field.label,
      required: field.required || false,
      validator: field.validator,
      type: field.type
    };
    setActiveColumns(prev => [...prev, newColumn]);

    // Update all rows to include the new field
    setRows(rows.map(row => ({
      ...row,
      [field.id]: '',
    })));
  };

  // Remove a field from the table
  const handleRemoveField = (fieldId: string) => {
    if (!isColumnRemovable(fieldId)) return;

    // Remove the column
    setActiveColumns(prev => prev.filter(col => col.id !== fieldId));

    // Remove the field from all rows
    setRows(rows.map(row => {
      const newRow = { ...row };
      delete newRow[fieldId];
      return newRow;
    }));

    // Clear any errors for this field
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.endsWith(`-${fieldId}`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  // Render a table cell based on the column type
  const renderTableCell = (column: ColumnDefinition, row: RowData, rowIndex: number) => {
    const value = row[column.id] || '';
    const error = errors[`${rowIndex}-${column.id}`];
    const baseInputClasses = `block w-full px-3 py-2 text-sm border-0 placeholder-gray-400 focus:ring-0 focus:outline-none ${
      error ? 'text-red-900' : 'text-gray-900'
    }`;

    // Find the field definition
    const field = formFields.find(f => f.id === column.id);
    
    // Special handling for boolean fields (radio or is_* fields)
    if (field?.type === 'radio' || column.id.startsWith('is_')) {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <select
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for date fields
    if (field?.type === 'date') {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <input
              type="date"
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
            />
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for number fields
    if (field?.type === 'number') {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <input
              type="number"
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
              step={column.id === 'erc20_decimals' ? '1' : 'any'}
            />
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for multiselect fields
    if (field?.type === 'multiselect' && field.options) {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <select
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select...</option>
              {field.options.map((option: { value: string | number; label: string }) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for chain_id
    if (column.id === 'chain_id') {
      const isValidChain = value && CHAIN_OPTIONS.some(option => option.value === value);
      const selectValue = isValidChain ? value : '';
      
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <select
              value={selectValue}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="" disabled>Select a chain</option>
              {CHAIN_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {/* Show invalid chain value if not in options */}

            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for owner_project
    if (column.id === 'owner_project') {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <OwnerProjectInput
            value={value}
            onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
            validProjects={validProjects}
            isLoadingProjects={isLoadingProjects}
            error={error}
            baseInputClasses={baseInputClasses}
          />
        </td>
      );
    }

    // Special handling for usage_category
    if (column.id === 'usage_category') {
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <input
              type="text"
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
              list={`valid-categories-${rowIndex}`}
            />
            {value && VALID_CATEGORY_IDS.includes(value) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">✓</div>
            )}
            <datalist id={`valid-categories-${rowIndex}`}>
              {VALID_CATEGORY_IDS.map(categoryId => (
                <option key={categoryId} value={categoryId} />
              ))}
            </datalist>
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Special handling for paymaster_category
    if (column.id === 'paymaster_category') {
      const validPaymasterCategories = ['verifying', 'token', 'verifying_and_token'];
      return (
        <td key={column.id} className="relative" data-field={column.id}>
          <div className="relative w-full">
            <select
              value={value}
              onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select a paymaster category</option>
              <option value="verifying">Verifying</option>
              <option value="token">Token</option>
              <option value="verifying_and_token">Verifying and Token</option>
            </select>
            {value && validPaymasterCategories.includes(value) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">✓</div>
            )}
            {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
          </div>
        </td>
      );
    }

    // Default input field for other columns
    return (
      <td key={column.id} className="relative" data-field={column.id}>
        <div className="relative w-full">
          <input
            type="text"
            value={value}
            onChange={(e) => updateRow(rowIndex, column.id, e.target.value)}
            className={baseInputClasses}
            placeholder={`Enter ${column.name.toLowerCase()}`}
          />
          {error && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500" />}
        </div>
      </td>
    );
  };

  return (
    <div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type as "error" | "success"}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Attestation</h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Template
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>
          
          {/* Network info banner - Only show in advanced mode */}
          {enableNetworkSelection && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Network:</span> All bulk attestations will be recorded on{' '}
                <span className="font-semibold">{getNetworkConfig(selectedAttestationNetwork).name}</span>.
                {selectedAttestationNetwork === 8453 || selectedAttestationNetwork === 84532 ? 
                  ' Coinbase Smart Wallet users can use sponsored transactions (no gas fees).' : 
                  ' Gas fees apply for this network.'}
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Enter multiple addresses and their associated tags for bulk attestation. All attestations will be submitted in a single transaction, saving gas and time.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Note: Using the multiAttest feature requires only one signature for all attestations, making the process more efficient. Maximum of 50 attestations allowed per batch.
            </p>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Row
            </button>
            <BulkFieldSelector
              currentFields={activeColumns.map(col => col.id)}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
            />
          </div>
        </div>

        {/* Validation Summary */}
        {showValidationSummary && (
          <ValidationSummary
            errors={errors}
            warnings={warnings}
            rows={rows}
            activeColumns={activeColumns}
            onSuggestionClick={handleSuggestionSelection}
            onClose={handleCloseValidationSummary}
            onNavigateToField={handleNavigateToField}
            isValidationMode={isValidationMode}
          />
        )}

        <div className={`transition-colors duration-300 ${
          (() => {
            const hasErrors = Object.keys(errors).length > 0;
            const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
              warningList.some(w => !w.isConversion)
            );
            const isValidated = !hasErrors && !hasRealWarnings && isValidationMode;
            // Only add border-t if validation summary is not showing (to avoid double border)
            const hasBorderTop = !showValidationSummary || (showValidationSummary && (hasErrors || hasRealWarnings));
            return `${hasBorderTop ? 'border-t' : ''} ${isValidated 
              ? 'border-green-200' 
              : 'border-gray-200'}`;
          })()
        }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {activeColumns.map((column) => (
                    <th
                      key={column.id}
                      className={`px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group transition-colors duration-300 ${
                        (() => {
                          const hasErrors = Object.keys(errors).length > 0;
                          const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                            warningList.some(w => !w.isConversion)
                          );
                          const isValidated = !hasErrors && !hasRealWarnings && isValidationMode;
                          return isValidated 
                            ? 'bg-green-50' 
                            : 'bg-gray-50';
                        })()
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span>{column.name}</span>
                          {column.required && (
                            <span className="text-red-500" title="Required field">*</span>
                          )}
                        </div>
                        {isColumnRemovable(column.id) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(column.id)}
                            className="invisible group-hover:visible ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                            title={`Remove ${column.name} field`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className={`w-10 px-3 py-3.5 transition-colors duration-300 ${
                    (() => {
                      const hasErrors = Object.keys(errors).length > 0;
                      const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                        warningList.some(w => !w.isConversion)
                      );
                      const isValidated = !hasErrors && !hasRealWarnings && isValidationMode;
                      return isValidated 
                        ? 'bg-green-50' 
                        : 'bg-gray-50';
                    })()
                  }`} />
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 transition-colors duration-300 ${
                (() => {
                  const hasErrors = Object.keys(errors).length > 0;
                  const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                    warningList.some(w => !w.isConversion)
                  );
                  const isValidated = !hasErrors && !hasRealWarnings && isValidationMode;
                  return isValidated 
                    ? 'bg-green-25' 
                    : 'bg-white';
                })()
              }`}>
                {rows.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`transition-colors ${
                      (() => {
                        const hasErrors = Object.keys(errors).length > 0;
                        const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                          warningList.some(w => !w.isConversion)
                        );
                        const isValidated = !hasErrors && !hasRealWarnings && isValidationMode;
                        return isValidated 
                          ? 'hover:bg-green-50' 
                          : 'hover:bg-gray-50';
                      })()
                    }`}
                    data-row-index={rowIndex}
                  >
                    {activeColumns.map((column) => renderTableCell(column, row, rowIndex))}
                    <td className="w-10 p-0">
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIndex)}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmissionRequest}
              disabled={isSubmitting || rows.length === 0}
              className={(() => {
                const hasErrors = Object.keys(errors).length > 0;
                const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                  warningList.some(w => !w.isConversion)
                );
                const hasIssues = hasErrors || hasRealWarnings;
                const isValidated = !hasIssues && isValidationMode;
                
                return hasIssues 
                  ? "flex justify-center items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                  : `flex justify-center items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] relative overflow-hidden ${isValidated ? 'animate-pulse-glow' : ''}`;
              })()}
            >
              {/* Glare effect when validated */}
              {(() => {
                const hasErrors = Object.keys(errors).length > 0;
                const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                  warningList.some(w => !w.isConversion)
                );
                const hasIssues = hasErrors || hasRealWarnings;
                const isValidated = !hasIssues && isValidationMode;
                
                return isValidated ? (
                  <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-glare-sweep"></div>
                ) : null;
              })()}
              
              {isSubmitting ? (
                <div className="relative z-10 flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                (() => {
                  const hasErrors = Object.keys(errors).length > 0;
                  const hasRealWarnings = Object.entries(warnings).some(([, warningList]) => 
                    warningList.some(w => !w.isConversion)
                  );
                  const hasIssues = hasErrors || hasRealWarnings;
                  
                  return hasIssues ? (
                    <div className="relative z-10 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Validate Values
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Create Bulk Attestations
                    </div>
                  );
                })()
              )}
            </button>
          </div>
        </div>
      </div>
      
      <BulkConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBulkSubmit}
        data={confirmationData || []}
        chainOptions={CHAIN_OPTIONS}
      />
    </div>
  );
};

export default BulkAttestationForm;
