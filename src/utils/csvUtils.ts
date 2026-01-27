import { RowData, ColumnDefinition, ValidationWarning } from '../types/attestation';
import { CHAINS } from '../constants/chains';
import { formFields } from '../constants/formFields';
import { validateProjectField } from './projectValidation';
import { validateCategoryField, convertCategoryAlias } from './categoryValidation';
import { validatePaymasterField, convertPaymasterAlias } from './paymasterValidation';
import { parseCaip10 } from './caipUtils';

const levenshtein = (a: string, b: string): number => {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(an + 1).fill(0).map(() => Array(bn + 1).fill(0));
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // Deletion
                matrix[i][j - 1] + 1,      // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }
    return matrix[an][bn];
};

const mapHeaderToField = (header: string): string | null => {
    const normalizedHeader = header.trim().toLowerCase().replace(/[\s_-]/g, '');
    let bestMatch: string | null = null;
    let minDistance = Infinity;

    if (!normalizedHeader) return null;

    const headerAliases: { [key: string]: string } = {
        originkey: 'chain_id'
    };
    if (headerAliases[normalizedHeader]) {
        return headerAliases[normalizedHeader];
    }

    for (const field of formFields) {
        const normalizedFieldId = field.id.toLowerCase().replace(/[\s_-]/g, '');
        const normalizedFieldLabel = field.label.toLowerCase().replace(/[\s_-]/g, '');

        const distanceId = levenshtein(normalizedHeader, normalizedFieldId);
        if (distanceId < minDistance) {
            minDistance = distanceId;
            bestMatch = field.id;
        }

        const distanceLabel = levenshtein(normalizedHeader, normalizedFieldLabel);
        if (distanceLabel < minDistance) {
            minDistance = distanceLabel;
            bestMatch = field.id;
        }
    }

    const threshold = normalizedHeader.length > 5 ? 2 : 1;
    if (minDistance <= threshold) {
        return bestMatch;
    }

    return null;
};

const convertChainId = (value: string): string => {
    if (!value || !value.trim()) return value;
    
    const normalizedValue = value.trim().toLowerCase();
    
    // If it's already in correct CAIP-2 format and valid, return it properly cased
    if (/^eip155:\d+$/.test(normalizedValue)) {
        const chain = CHAINS.find(c => c.caip2.toLowerCase() === normalizedValue);
        if (chain) return chain.caip2; // Return the properly cased version
        // If format is correct but chain not found, return original to trigger validation error
        return value;
    }
    
    // Check if it's a numeric chain ID (e.g., "1", "10", "137")
    const numericMatch = normalizedValue.match(/^\d+$/);
    if (numericMatch) {
        const chainId = `eip155:${numericMatch[0]}`;
        const chain = CHAINS.find(c => c.caip2 === chainId);
        if (chain) return chain.caip2;
    }
    
    // Try to find by chain ID (the part after "eip155:")
    const chainById = CHAINS.find(c => c.id.toLowerCase() === normalizedValue);
    if (chainById) return chainById.caip2;
    
    // Try to find by chain name (case insensitive)
    const chainByName = CHAINS.find(c => c.name.toLowerCase() === normalizedValue);
    if (chainByName) return chainByName.caip2;
    
    // Try to find by short name
    const chainByShortName = CHAINS.find(c => c.shortName.toLowerCase() === normalizedValue);
    if (chainByShortName) return chainByShortName.caip2;

    // Check common aliases - only include aliases for chains that actually exist
    const aliases: { [key: string]: string } = {
        'mainnet': 'eip155:1',
        'ethereum': 'eip155:1',
        'eth': 'eip155:1',
        'optimism': 'eip155:10',
        'op': 'eip155:10',
        'matic': 'eip155:137',
        'polygon': 'eip155:137',
        'polygon_pos': 'eip155:137',
        'base': 'eip155:8453',
        'arbitrum': 'eip155:42161',
        'arb': 'eip155:42161',
        'arbitrumone': 'eip155:42161',
        'arbitrumnova': 'eip155:42170',
        'celo': 'eip155:42220',
        'linea': 'eip155:59144',
        'polygonzkevm': 'eip155:1101',
        'gnosis': 'eip155:100',
        'moonbeam': 'eip155:1284',
        'cronos': 'eip155:25',
        'aurora': 'eip155:1313161554',
        'zircuit': 'eip155:48900'
    };
    
    // Check aliases
    if (aliases[normalizedValue]) {
        return aliases[normalizedValue];
    }

    // If no conversion found, return empty string so validation shows "required" error
    return '';
};

// Chain validation is now handled directly in BulkAttestationForm.tsx
// using the validateChain function from validation.ts

interface ParsedLine {
    values: string[];
    error?: string;
}

const parseCsvLine = (line: string): ParsedLine => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
                currentValue += '"';
                i++; // Skip the second quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue);

    // An unterminated quote is no longer a fatal error. We just accept the value as is.
    return { values: values.map(v => v.trim()) };
};

const cleanValue = (value: string, column?: ColumnDefinition): string => {
    let cleanedValue = value.trim();

    if (cleanedValue.startsWith('"') && cleanedValue.endsWith('"')) {
        cleanedValue = cleanedValue.substring(1, cleanedValue.length - 1).replace(/""/g, '"');
    }

    if (column) {
        const isBooleanField = column.type === 'radio' || column.id.startsWith('is_');
        if (isBooleanField) {
            const lowerValue = cleanedValue.toLowerCase();
            if (['1', 'true', 'yes'].includes(lowerValue)) return 'true';
            if (['0', 'false', 'no'].includes(lowerValue)) return 'false';
        }
    }

    return cleanedValue;
};

interface ParseResult {
    rows: RowData[];
    columns: ColumnDefinition[];
    warnings: { [key: string]: ValidationWarning[] };
    errors: string[];
    conversions: { [key: string]: { original: string; converted: string; field: string } };
}

export const parseAndCleanCsv = async (csvText: string, emptyRow: RowData): Promise<ParseResult> => {
    const lines = csvText.split('\n').map(line => line.trim());
    const errors: string[] = [];
    const warnings: { [key: string]: ValidationWarning[] } = {};
    const conversions: { [key: string]: { original: string; converted: string; field: string } } = {};

    if (lines.length < 2 || lines.slice(1).every(line => !line)) {
        errors.push('CSV file must contain a header and at least one data row.');
        return { rows: [], columns: [], warnings, errors, conversions };
    }

    const headerLine = lines[0];
    const headerParseResult = parseCsvLine(headerLine);
    if (headerParseResult.error) {
        errors.push(`Error in header row: ${headerParseResult.error}`);
        return { rows: [], columns: [], warnings, errors, conversions };
    }
    const headers = headerParseResult.values;
    const detectedColumns: ColumnDefinition[] = [];
    const headerToFieldId: { [header: string]: string | null } = {};
    const mappedFieldIds = new Set<string>();

    headers.forEach((header, index) => {
        const fieldId = mapHeaderToField(header);
        headerToFieldId[header] = fieldId;

        if (fieldId) {
            if (mappedFieldIds.has(fieldId)) {
                errors.push(`Duplicate column detected: More than one column maps to the field "${fieldId}".`);
            }
            mappedFieldIds.add(fieldId);
            const field = formFields.find(f => f.id === fieldId);
            if (field && !detectedColumns.some(c => c.id === field.id)) {
                detectedColumns.push({
                    id: field.id,
                    name: field.label,
                    required: field.required || false,
                    validator: field.validator,
                    type: field.type,
                });
            }
        } else if(header.trim()) {
            const key = `header-${index}`;
            warnings[key] = warnings[key] || [];
            warnings[key].push({ message: `Column "${header}" was not recognized and will be ignored.` });
        }
    });

    if (errors.length > 0) {
        return { rows: [], columns: [], warnings, errors, conversions };
    }
    
    const requiredFields = formFields.filter(f => f.required);
    const missingRequired = requiredFields.filter(f => !detectedColumns.some(c => c.id === f.id));

    if (missingRequired.length > 0) {
        errors.push(`Missing required columns: ${missingRequired.map(f => f.label).join(', ')}`);
        return { rows: [], columns: detectedColumns, warnings, errors, conversions };
    }

    const dataRows = lines.slice(1);
    const newRows: RowData[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i];
        const originalLineNumber = i + 2;

        if (line.trim() === '') {
            continue;
        }

        const rowIndex = i;
        const lineParseResult = parseCsvLine(line);

        if (lineParseResult.error) {
            errors.push(`Error on data row ${originalLineNumber}: ${lineParseResult.error}`);
            continue;
        }
        const values = lineParseResult.values;

        if (values.every(val => val === '')) continue;

        if (values.length > headers.length) {
            warnings[rowIndex] = warnings[rowIndex] || [];
            warnings[rowIndex].push({ message: `Row ${originalLineNumber} has more cells than the header. Extra cells will be ignored.` });
        }
        
        const row: RowData = { ...emptyRow };

        for (let j = 0; j < headers.length; j++) {
            if (j >= values.length) {
                row[headers[j]] = ''; 
                continue;
            }
            
            const header = headers[j];
            const fieldId = headerToFieldId[header];

            if (fieldId) {
                let value = values[j];
                const columnDef = detectedColumns.find(c => c.id === fieldId);
                
                if (fieldId === 'chain_id') {
                    const originalValue = value;
                    value = convertChainId(value);
                    
                    // Track conversion if value changed
                    if (originalValue !== value && originalValue.trim() !== '') {
                        const conversionKey = `${rowIndex}-${fieldId}`;
                        conversions[conversionKey] = {
                            original: originalValue,
                            converted: value || '(empty - invalid chain)',
                            field: 'Chain ID'
                        };
                    }
                } else if (fieldId === 'usage_category') {
                    const originalValue = value;
                    value = convertCategoryAlias(value);
                    
                    // Track conversion if value changed
                    if (originalValue !== value && originalValue.trim() !== '') {
                        const conversionKey = `${rowIndex}-${fieldId}`;
                        conversions[conversionKey] = {
                            original: originalValue,
                            converted: value,
                            field: 'Usage Category'
                        };
                    }
                } else if (fieldId === 'paymaster_category') {
                    const originalValue = value;
                    value = convertPaymasterAlias(value);
                    
                    // Track conversion if value changed
                    if (originalValue !== value && originalValue.trim() !== '') {
                        const conversionKey = `${rowIndex}-${fieldId}`;
                        conversions[conversionKey] = {
                            original: originalValue,
                            converted: value,
                            field: 'Paymaster Category'
                        };
                    }
                }
                
                row[fieldId] = cleanValue(value, columnDef);
                
                // Chain validation is now handled by the standard validation in BulkAttestationForm
                // validateChainValue is kept for potential future use but not called here
                // to avoid duplicate validation
                
                // Validate project fields
                const projectWarnings = await validateProjectField(fieldId, row[fieldId], true);
                if (projectWarnings.length > 0) {
                    const key = `${rowIndex}-${fieldId}`;
                    warnings[key] = warnings[key] || [];
                    warnings[key].push(...projectWarnings);
                    
                    // Add project errors to errors array for red line display
                    const projectErrors = projectWarnings.filter(w => w.isError);
                    if (projectErrors.length > 0) {
                        errors.push(`Row ${rowIndex + 1}: ${projectErrors[0].message}`);
                    }
                }
                
                // Validate category fields
                const categoryWarnings = await validateCategoryField(fieldId, row[fieldId]);
                if (categoryWarnings.length > 0) {
                    const key = `${rowIndex}-${fieldId}`;
                    warnings[key] = warnings[key] || [];
                    warnings[key].push(...categoryWarnings);
                }
                
                // Validate paymaster fields
                const paymasterWarnings = await validatePaymasterField(fieldId, row[fieldId]);
                if (paymasterWarnings.length > 0) {
                    const key = `${rowIndex}-${fieldId}`;
                    warnings[key] = warnings[key] || [];
                    warnings[key].push(...paymasterWarnings);
                }
            }
        }

        const parsedCaip10 = parseCaip10(row.address);
        if (parsedCaip10) {
            const previousChainId = row.chain_id;
            row.address = parsedCaip10.address;
            if (parsedCaip10.isKnownChain && !row.chain_id) {
                row.chain_id = parsedCaip10.chainId;
                const chainWarningKey = `${rowIndex}-chain_id`;
                warnings[chainWarningKey] = warnings[chainWarningKey] || [];
                warnings[chainWarningKey].push({
                    message: `Chain ID set from CAIP-10 address: ${parsedCaip10.chainId}`,
                    isConversion: true
                });
            } else if (parsedCaip10.isKnownChain && previousChainId && previousChainId !== parsedCaip10.chainId) {
                const addressWarningKey = `${rowIndex}-address`;
                warnings[addressWarningKey] = warnings[addressWarningKey] || [];
                warnings[addressWarningKey].push({
                    message: `CAIP-10 chain (${parsedCaip10.chainId}) does not match chain_id (${previousChainId}).`,
                    isError: true
                });
            }
        }
        newRows.push(row);
    }

    if (errors.length > 0 && newRows.length === 0) {
        return { rows: [], columns: detectedColumns, warnings, errors, conversions };
    }

    return { rows: newRows, columns: detectedColumns, warnings, errors, conversions };
};
