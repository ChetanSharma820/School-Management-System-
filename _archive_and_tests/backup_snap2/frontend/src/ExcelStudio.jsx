import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { api } from './api';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Table, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  FileDown,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ExcelStudio({ onDataImported, onNavigate }) {
  // Mode: 'editor' (Create/Export Multi-sheet) or 'importer' (Upload .xlsx to DB)
  const [viewMode, setViewMode] = useState('editor');

  // Multi-Sheet Workbook State
  const [sheets, setSheets] = useState([
    {
      id: 'sheet-1',
      name: 'Students_Data',
      columns: ['roll_number', 'first_name', 'last_name', 'email', 'phone', 'dob'],
      rows: [
        { roll_number: 'STU-1005', first_name: 'David', last_name: 'Clark', email: 'david.c@student.edu', phone: '555-4401', dob: '2008-05-14' },
        { roll_number: 'STU-1006', first_name: 'Olivia', last_name: 'Martinez', email: 'olivia.m@student.edu', phone: '555-4402', dob: '2008-11-20' }
      ]
    },
    {
      id: 'sheet-2',
      name: 'Fee_Receipts',
      columns: ['student_id', 'fee_category', 'gross_amount', 'discount_amount', 'amount_paid', 'payment_method'],
      rows: [
        { student_id: '1', fee_category: 'Tuition Fee', gross_amount: '30000', discount_amount: '2000', amount_paid: '28000', payment_method: 'UPI / QR' }
      ]
    }
  ]);

  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [newSheetName, setNewSheetName] = useState('');
  const [newColName, setNewColName] = useState('');

  // Importer State
  const [uploadedWorkbook, setUploadedWorkbook] = useState(null);
  const [uploadedSheetNames, setUploadedSheetNames] = useState([]);
  const [selectedUploadSheet, setSelectedUploadSheet] = useState('');
  const [parsedUploadData, setParsedUploadData] = useState([]);
  const [targetTable, setTargetTable] = useState('students');
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  // Pagination for Preview
  const [previewPage, setPreviewPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const currentSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  // -------------------------------------------------------------
  // Sheet Management Actions
  // -------------------------------------------------------------
  const handleAddSheet = () => {
    const name = newSheetName.trim() || `Sheet_${sheets.length + 1}`;
    const newSheet = {
      id: `sheet-${Date.now()}`,
      name: name.replace(/[^a-zA-Z0-9_-]/g, '_'),
      columns: ['col_1', 'col_2', 'col_3'],
      rows: [{ col_1: '', col_2: '', col_3: '' }]
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
    setNewSheetName('');
  };

  const handleDeleteSheet = (id, e) => {
    e.stopPropagation();
    if (sheets.length <= 1) {
      alert('You must keep at least one sheet in the workbook.');
      return;
    }
    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (activeSheetId === id) {
      setActiveSheetId(updated[0].id);
    }
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const colKey = newColName.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
    const updated = sheets.map(s => {
      if (s.id === activeSheetId) {
        if (s.columns.includes(colKey)) {
          alert('Column already exists!');
          return s;
        }
        return {
          ...s,
          columns: [...s.columns, colKey],
          rows: s.rows.map(r => ({ ...r, [colKey]: '' }))
        };
      }
      return s;
    });
    setSheets(updated);
    setNewColName('');
  };

  const handleAddRow = () => {
    const emptyRow = {};
    currentSheet.columns.forEach(col => { emptyRow[col] = ''; });
    const updated = sheets.map(s => {
      if (s.id === activeSheetId) {
        return { ...s, rows: [...s.rows, emptyRow] };
      }
      return s;
    });
    setSheets(updated);
  };

  const handleCellChange = (rowIndex, colKey, value) => {
    const updated = sheets.map(s => {
      if (s.id === activeSheetId) {
        const newRows = [...s.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: value };
        return { ...s, rows: newRows };
      }
      return s;
    });
    setSheets(updated);
  };

  const handleDeleteRow = (rowIndex) => {
    const updated = sheets.map(s => {
      if (s.id === activeSheetId) {
        const newRows = s.rows.filter((_, idx) => idx !== rowIndex);
        return { ...s, rows: newRows.length ? newRows : [{}] };
      }
      return s;
    });
    setSheets(updated);
  };

  // -------------------------------------------------------------
  // Populate Active Sheet from Live Database
  // -------------------------------------------------------------
  const handlePopulateFromDB = async (tableName) => {
    try {
      let data = [];
      if (tableName === 'students') data = await api.getStudents();
      else if (tableName === 'teachers') data = await api.getTeachers();
      else if (tableName === 'student_fees') data = await api.getFees();
      else if (tableName === 'teacher_salaries') data = await api.getSalaries();
      else if (tableName === 'classes') data = await api.getClasses();

      if (!Array.isArray(data) || data.length === 0) {
        alert(`No data found in database table '${tableName}'.`);
        return;
      }

      const sample = data[0];
      const cols = Object.keys(sample).filter(k => typeof sample[k] !== 'object');

      const flatRows = data.map(item => {
        const row = {};
        cols.forEach(c => { row[c] = item[c] !== null && item[c] !== undefined ? String(item[c]) : ''; });
        return row;
      });

      const updated = sheets.map(s => {
        if (s.id === activeSheetId) {
          return {
            ...s,
            name: `${tableName}_Live`,
            columns: cols,
            rows: flatRows
          };
        }
        return s;
      });

      setSheets(updated);
      alert(`Loaded all ${flatRows.length} rows from table '${tableName}' into active sheet!`);
    } catch (err) {
      alert('Error fetching from database: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Export Multi-Sheet Excel File (.xlsx)
  // -------------------------------------------------------------
  const handleExportWorkbook = () => {
    const wb = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      const cleanRows = sheet.rows.map(row => {
        const clean = {};
        sheet.columns.forEach(col => {
          clean[col] = row[col] || '';
        });
        return clean;
      });

      const ws = XLSX.utils.json_to_sheet(cleanRows, { header: sheet.columns });
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
    });

    const filename = `School_Database_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // -------------------------------------------------------------
  // File Upload & Sheet Parser (Importer)
  // -------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setUploadedWorkbook(wb);
        setUploadedSheetNames(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          setSelectedUploadSheet(wb.SheetNames[0]);
          parseSheetData(wb, wb.SheetNames[0]);
        }
        setImportResult(null);
        setPreviewPage(1);
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseSheetData = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    // Convert sheet to JSON array
    const data = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    setParsedUploadData(data);
  };

  const handleUploadSheetChange = (sheetName) => {
    setSelectedUploadSheet(sheetName);
    if (uploadedWorkbook) {
      parseSheetData(uploadedWorkbook, sheetName);
      setPreviewPage(1);
    }
  };

  // -------------------------------------------------------------
  // Helper: Smart Date Sanitizer (Supports ISO, DD/MM/YYYY, Excel Timestamps)
  // -------------------------------------------------------------
  const sanitizeDate = (val, fallback = '2008-01-01') => {
    if (!val) return fallback;
    const str = String(val).trim();
    if (!str) return fallback;

    // Check if it's already YYYY-MM-DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) {
      const parts = str.split(/[-/]/);
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].substring(0, 2).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Check if it's DD/MM/YYYY or DD-MM-YYYY (e.g. 13/04/2007)
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(str)) {
      const parts = str.split(/[-/]/);
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      const y = parts[2].substring(0, 4);
      if (p1 > 12) {
        // p1 is day, p2 is month
        return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      } else if (p2 > 12) {
        // p2 is day, p1 is month
        return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      } else {
        return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
    }

    // Try parsing with JS Date
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return fallback;
  };

  // -------------------------------------------------------------
  // Helper: Smart Column Finder
  // -------------------------------------------------------------
  const findValue = (row, candidateKeys) => {
    const rowKeys = Object.keys(row);
    for (const cand of candidateKeys) {
      const match = rowKeys.find(k => k.trim().toLowerCase().replace(/[\s_-]/g, '') === cand.toLowerCase().replace(/[\s_-]/g, ''));
      if (match && row[match] !== undefined && row[match] !== '') {
        return row[match];
      }
    }
    return null;
  };

  // -------------------------------------------------------------
  // Import / Sync Sheet into Database (Supabase via C++ Backend)
  // -------------------------------------------------------------
  const handleUploadToDatabase = async () => {
    if (!parsedUploadData || parsedUploadData.length === 0) {
      alert('Selected sheet contains no rows to import.');
      return;
    }

    const totalRows = parsedUploadData.length;
    setImportLoading(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Fetch DB metadata for Foreign Key resolution
      const validClassIds = new Set();
      let defaultClassId = 1;
      const studentMapById = new Map();
      const studentMapByRoll = new Map();
      let defaultStudentId = 1;

      if (targetTable === 'students') {
        const clsList = await api.getClasses().catch(() => []);
        if (Array.isArray(clsList) && clsList.length > 0) {
          clsList.forEach(c => validClassIds.add(c.id));
          defaultClassId = clsList[0].id;
        }
      } else if (targetTable === 'student_fees') {
        const stuList = await api.getStudents().catch(() => []);
        if (Array.isArray(stuList) && stuList.length > 0) {
          stuList.forEach(s => {
            studentMapById.set(s.id, s);
            if (s.roll_number) studentMapByRoll.set(s.roll_number, s);
          });
          defaultStudentId = stuList[0].id;
        }
      }

      // 1. Format all parsed rows into clean domain objects
      const nowTimestamp = Date.now();
      const preparedRecords = parsedUploadData.map((row, idx) => {
        const absoluteIndex = idx + 1;
        if (targetTable === 'students') {
          const rawRoll = findValue(row, ['roll_number', 'roll_no', 'rollno', 'roll', 'student_id']);
          const roll_number = rawRoll ? String(rawRoll).trim() : `STU-${1000 + absoluteIndex}`;
          const first_name = findValue(row, ['first_name', 'firstname', 'first', 'name', 'student_name']) || `Student_${absoluteIndex}`;
          const last_name = findValue(row, ['last_name', 'lastname', 'last', 'surname']) || '';
          const rawEmail = findValue(row, ['email', 'email_address', 'mail']);
          const email = rawEmail ? String(rawEmail).trim() : `student_${nowTimestamp}_${absoluteIndex}@school.edu`;
          const phone = findValue(row, ['phone', 'contact', 'mobile', 'cell', 'phone_number']) || '';
          
          const rawDob = findValue(row, ['dob', 'date_of_birth', 'birth_date', 'birthdate']);
          const dob = sanitizeDate(rawDob, '2008-01-01');

          const rawEnroll = findValue(row, ['enrollment_date', 'enrollment', 'admission_date']);
          const enrollment_date = sanitizeDate(rawEnroll, '2026-06-01');

          const rawClass = findValue(row, ['class_id', 'class', 'grade']);
          let class_id = parseInt(rawClass);
          if (isNaN(class_id) || (validClassIds.size > 0 && !validClassIds.has(class_id))) {
            class_id = defaultClassId;
          }

          return {
            roll_number: String(roll_number),
            first_name: String(first_name),
            last_name: String(last_name),
            email: String(email),
            phone: String(phone),
            dob: dob,
            class_id: class_id,
            enrollment_date: enrollment_date
          };
        } else if (targetTable === 'teachers') {
          const rawEmp = findValue(row, ['employee_id', 'emp_id', 'teacher_id', 'empid']);
          const employee_id = rawEmp ? String(rawEmp).trim() : `TCH-${100 + absoluteIndex}`;
          const first_name = findValue(row, ['first_name', 'firstname', 'name', 'teacher_name']) || `Teacher_${absoluteIndex}`;
          const last_name = findValue(row, ['last_name', 'lastname', 'last']) || '';
          const rawEmail = findValue(row, ['email', 'email_address']);
          const email = rawEmail ? String(rawEmail).trim() : `teacher_${nowTimestamp}_${absoluteIndex}@school.edu`;
          const phone = findValue(row, ['phone', 'contact', 'mobile']) || '';
          const qualification = findValue(row, ['qualification', 'subject', 'degree', 'designation']) || 'Faculty';

          return {
            employee_id: String(employee_id),
            first_name: String(first_name),
            last_name: String(last_name),
            email: String(email),
            phone: String(phone),
            qualification: String(qualification)
          };
        } else if (targetTable === 'student_fees') {
          const gross = parseFloat(findValue(row, ['gross_amount', 'gross', 'amount', 'fee', 'total_fee']) || 25000);
          const discount = parseFloat(findValue(row, ['discount_amount', 'discount', 'scholarship']) || 0);
          const late = parseFloat(findValue(row, ['late_fine', 'fine', 'penalty']) || 0);
          const paid = parseFloat(findValue(row, ['amount_paid', 'paid', 'paid_amount']) || gross);
          const net = gross - discount + late;
          const balance = Math.max(0, net - paid);
          
          const rawSid = findValue(row, ['student_id', 'sid']);
          const rawRoll = findValue(row, ['roll_number', 'roll_no', 'rollno', 'roll']);
          let resolvedStudentId = defaultStudentId;
          const numSid = parseInt(rawSid);
          if (!isNaN(numSid) && studentMapById.has(numSid)) {
            resolvedStudentId = numSid;
          } else if (rawRoll && studentMapByRoll.has(String(rawRoll).trim())) {
            resolvedStudentId = studentMapByRoll.get(String(rawRoll).trim()).id;
          }

          const rawRec = findValue(row, ['receipt_no', 'receipt', 'invoice_no']);
          const receipt_no = rawRec ? String(rawRec).trim() : `REC-2026-${1000 + absoluteIndex}`;

          const rawDue = findValue(row, ['due_date', 'due']);
          const due_date = sanitizeDate(rawDue, '2026-09-30');

          const rawPayDate = findValue(row, ['payment_date', 'date']);
          const payment_date = rawPayDate ? sanitizeDate(rawPayDate, new Date().toISOString().slice(0, 10)) : undefined;

          const feeRecord = {
            receipt_no: String(receipt_no),
            student_id: resolvedStudentId,
            academic_year: String(findValue(row, ['academic_year', 'year', 'session']) || '2026-2027'),
            term_name: String(findValue(row, ['term_name', 'term']) || 'Term 1'),
            fee_category: String(findValue(row, ['fee_category', 'category', 'type']) || 'Tuition Fee'),
            gross_amount: gross,
            discount_amount: discount,
            late_fine: late,
            net_payable: net,
            amount_paid: paid,
            balance_due: balance,
            payment_status: balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending',
            payment_method: String(findValue(row, ['payment_method', 'method', 'mode']) || 'Online Transfer'),
            due_date: due_date
          };
          if (payment_date) feeRecord.payment_date = payment_date;
          return feeRecord;
        }
        return row;
      });

      // 2. Upload in high-speed bulk chunks (50 items per bulk POST)
      const chunkSize = 50;
      for (let i = 0; i < preparedRecords.length; i += chunkSize) {
        const chunk = preparedRecords.slice(i, i + chunkSize);
        try {
          if (targetTable === 'students') {
            await api.addStudent(chunk);
          } else if (targetTable === 'teachers') {
            await api.addTeacher(chunk);
          } else if (targetTable === 'student_fees') {
            await api.collectFee(chunk);
          }
          successCount += chunk.length;
        } catch (chunkErr) {
          console.warn('Chunk upload failed, falling back to individual items:', chunkErr);
          for (let item of chunk) {
            try {
              if (targetTable === 'students') await api.addStudent(item);
              else if (targetTable === 'teachers') await api.addTeacher(item);
              else if (targetTable === 'student_fees') await api.collectFee(item);
              successCount++;
            } catch (indErr) {
              errorCount++;
              if (!errors.includes(indErr.message)) {
                errors.push(indErr.message);
              }
            }
          }
        }
        setImportProgress(Math.round(((i + chunk.length) / totalRows) * 100));
      }

      setImportResult({
        total: totalRows,
        success: successCount,
        errors: errorCount,
        errorList: errors
      });

      if (onDataImported) {
        await onDataImported();
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Template Downloader
  // -------------------------------------------------------------
  const downloadTemplate = (type) => {
    const wb = XLSX.utils.book_new();
    let templateData = [];

    if (type === 'students') {
      templateData = [
        { roll_number: 'STU-2001', first_name: 'Ethan', last_name: 'Hunt', email: 'ethan.h@school.edu', phone: '555-9011', dob: '2008-03-12', class_id: 1 },
        { roll_number: 'STU-2002', first_name: 'Grace', last_name: 'Hopper', email: 'grace.h@school.edu', phone: '555-9012', dob: '2008-06-25', class_id: 1 }
      ];
    } else if (type === 'teachers') {
      templateData = [
        { employee_id: 'TCH-005', first_name: 'Alan', last_name: 'Turing', email: 'alan.turing@school.edu', phone: '555-7701', qualification: 'Ph.D. Computer Science' }
      ];
    } else if (type === 'fees') {
      templateData = [
        { student_id: 1, fee_category: 'Tuition Fee', gross_amount: 30000, discount_amount: 0, late_fine: 0, amount_paid: 30000, payment_method: 'UPI / QR', due_date: '2026-09-30' }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, `${type.toUpperCase()}_TEMPLATE`);
    XLSX.writeFile(wb, `${type}_import_template.xlsx`);
  };

  // Pagination slicing for preview table
  const totalPreviewPages = Math.ceil(parsedUploadData.length / pageSize) || 1;
  const paginatedRows = parsedUploadData.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  return (
    <div className="excel-studio-container">
      {/* Navigation Top Bar */}
      <div className="excel-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800' }}>Excel Database Studio & Multi-Sheet Manager</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Create multi-sheet workbooks from Supabase or upload full sheets (100+ entries) directly into your database.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className={viewMode === 'editor' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setViewMode('editor')}
          >
            <Table size={15} /> Multi-Sheet Studio
          </button>
          <button 
            className={viewMode === 'importer' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setViewMode('importer')}
          >
            <Upload size={15} /> Import Sheet to DB
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MULTI-SHEET EXCEL EDITOR & DB EXPORTER */}
      {/* ========================================================================= */}
      {viewMode === 'editor' && (
        <>
          {/* Sheet Actions & Tab Bar */}
          <div className="excel-top-bar" style={{ padding: '12px 18px', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Workbook Sheets:
              </span>
              <div className="sheet-tabs-container">
                {sheets.map(s => (
                  <button
                    key={s.id}
                    className={`sheet-tab-btn ${s.id === activeSheetId ? 'active' : ''}`}
                    onClick={() => setActiveSheetId(s.id)}
                  >
                    <FileSpreadsheet size={14} />
                    <span>{s.name}</span>
                    <span 
                      style={{ marginLeft: '4px', opacity: 0.6 }} 
                      onClick={(e) => handleDeleteSheet(s.id, e)}
                      title="Delete Sheet"
                    >
                      ✕
                    </span>
                  </button>
                ))}
              </div>

              {/* Add Sheet Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="New Sheet Name..."
                  value={newSheetName}
                  onChange={e => setNewSheetName(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'white',
                    width: '130px'
                  }}
                />
                <button className="add-sheet-btn" onClick={handleAddSheet}>
                  <Plus size={13} /> Add Sheet
                </button>
              </div>
            </div>

            {/* Quick Populate from DB & Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    handlePopulateFromDB(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-card)',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <option value="" disabled>⚡ Load DB Table into Sheet...</option>
                <option value="students">Students Table</option>
                <option value="teachers">Teachers Table</option>
                <option value="student_fees">Fee Receipts Table</option>
                <option value="teacher_salaries">Salary Pay-Slips Table</option>
                <option value="classes">Classes Table</option>
              </select>

              <button className="btn-primary" onClick={handleExportWorkbook} style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                <Download size={15} /> Export Multi-Sheet (.xlsx)
              </button>
            </div>
          </div>

          {/* Active Sheet Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Active Sheet: <strong>{currentSheet.name}</strong>
              </span>
              <span className="badge badge-paid" style={{ fontSize: '12px' }}>
                Total Records: {currentSheet.rows.length} Rows
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="New Column Name..."
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  width: '140px'
                }}
              />
              <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={handleAddColumn}>
                <Plus size={13} /> Add Column
              </button>
              <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={handleAddRow}>
                <Plus size={13} /> Add Row
              </button>
            </div>
          </div>

          {/* Excel Grid Table with Full Scroll & Row Headers */}
          <div className="excel-grid-wrapper" style={{ overflowX: 'auto', maxHeight: '620px' }}>
            <table className="excel-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center', background: '#0f172a' }}>Row #</th>
                  {currentSheet.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                  <th style={{ width: '50px', textAlign: 'center' }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {currentSheet.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ textAlign: 'center', background: '#1e293b', color: '#94a3b8', fontWeight: 'bold' }}>
                      {rIdx + 1}
                    </td>
                    {currentSheet.columns.map(col => (
                      <td key={col}>
                        <input 
                          type="text"
                          value={row[col] || ''}
                          onChange={e => handleCellChange(rIdx, col, e.target.value)}
                          placeholder={`Enter ${col}...`}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', background: '#0f172a' }}>
                      <button 
                        onClick={() => handleDeleteRow(rIdx)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                        title="Delete Row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: UPLOAD & IMPORT EXCEL SHEET INTO SUPABASE */}
      {/* ========================================================================= */}
      {viewMode === 'importer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Template Download Helpers */}
          <div className="card-table-wrapper" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Need sample Excel templates?</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Download pre-formatted templates matching database schema.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => downloadTemplate('students')}>
                <FileDown size={14} /> Student Template
              </button>
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => downloadTemplate('teachers')}>
                <FileDown size={14} /> Teacher Template
              </button>
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => downloadTemplate('fees')}>
                <FileDown size={14} /> Fees Template
              </button>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <label className="upload-dropzone">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }}
            />
            <FileSpreadsheet size={42} color="var(--primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
              {uploadedWorkbook ? 'File Loaded! Click to choose another file' : 'Click to Upload Excel Workbook (.xlsx / .csv)'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Supports multi-sheet workbooks with 100+ entries. You choose which sheet to import into Supabase.
            </p>
          </label>

          {/* Sheet Selector & Target DB Table Configuration */}
          {uploadedSheetNames.length > 0 && (
            <div className="excel-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    1. Choose Sheet to Import:
                  </label>
                  <select 
                    value={selectedUploadSheet}
                    onChange={e => handleUploadSheetChange(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-card)',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    {uploadedSheetNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    2. Target Database Table:
                  </label>
                  <select 
                    value={targetTable}
                    onChange={e => setTargetTable(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-card)',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="students">Students Table (`students`)</option>
                    <option value="teachers">Teachers Table (`teachers`)</option>
                    <option value="student_fees">Fee Receipts Table (`student_fees`)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleUploadToDatabase}
                  disabled={importLoading}
                  style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', padding: '10px 20px' }}
                >
                  <Database size={16} /> 
                  {importLoading ? `Uploading ${importProgress}% (${parsedUploadData.length} records)...` : `Sync & Upload All ${parsedUploadData.length} Records to Database`}
                </button>
              </div>
            </div>
          )}

          {/* Real-time Progress Bar */}
          {importLoading && (
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Syncing records with Supabase Cloud PostgreSQL...</span>
                <strong>{importProgress}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }}></div>
              </div>
            </div>
          )}

          {/* Import Result Banner */}
          {importResult && (
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: importResult.errors === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${importResult.errors === 0 ? 'var(--emerald)' : 'var(--amber)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {importResult.errors === 0 ? (
                <CheckCircle2 color="var(--emerald)" size={24} />
              ) : (
                <AlertCircle color="var(--amber)" size={24} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>
                  {importResult.errors === 0 ? `All ${importResult.success} Records Uploaded Successfully!` : `Import Complete: ${importResult.success} inserted, ${importResult.errors} notices`}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total processed from sheet: <strong>{importResult.total}</strong> records. All valid rows are now live in Supabase PostgreSQL!
                </p>
                {importResult.errorList && importResult.errorList.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#fca5a5' }}>
                    Notice: {importResult.errorList.slice(0, 3).join(' | ')}
                  </div>
                )}
              </div>
              {onNavigate && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {targetTable === 'students' && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => onNavigate('students')}>
                      View Student Directory →
                    </button>
                  )}
                  {targetTable === 'teachers' && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => onNavigate('teachers')}>
                      View Faculty Directory →
                    </button>
                  )}
                  {targetTable === 'student_fees' && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => onNavigate('fees')}>
                      View Fee Receipts →
                    </button>
                  )}
                  <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onNavigate('dashboard')}>
                    Dashboard →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Data Preview with Pagination */}
          {parsedUploadData.length > 0 && (
            <div className="card-table-wrapper">
              <div className="table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>
                    Sheet Preview: <strong>{selectedUploadSheet}</strong>
                  </h3>
                  <span className="badge badge-paid" style={{ fontSize: '11px' }}>
                    {parsedUploadData.length} Total Entries in Sheet
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Showing {(previewPage - 1) * pageSize + 1} - {Math.min(previewPage * pageSize, parsedUploadData.length)} of {parsedUploadData.length}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px' }}
                      disabled={previewPage === 1}
                      onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px' }}
                      disabled={previewPage === totalPreviewPages}
                      onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      {Object.keys(parsedUploadData[0] || {}).map(k => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-dim)' }}>
                          {(previewPage - 1) * pageSize + idx + 1}
                        </td>
                        {Object.keys(parsedUploadData[0] || {}).map(k => (
                          <td key={k}>{String(row[k] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
