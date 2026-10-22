const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const incomeCategories = ['Consulta', 'Exames', 'Convênio', 'Mensalidade', 'Outros'];
const expenseCategories = ['Aluguel', 'Salário', 'Equipamentos', 'Medicamentos', 'Marketing', 'Financiamento', 'Contas', 'Outros'];
const entriesStorageKey = 'controle-financeiro-entries';
const categoriesStorageKey = 'controle-financeiro-categories';
const receiptDatabaseName = 'controle-financeiro-receipts';
const receiptStoreName = 'receipts';
const paymentMethods = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit: 'Cartão de débito',
  credit: 'Cartão de crédito',
  transfer: 'Transferência',
  boleto: 'Boleto',
  other: 'Outro'
};

const state = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  entries: [],
  editingEntryId: null,
  customCategories: { income: [], expense: [] },
  receiptDatabase: null,
  receiptObjectUrl: null
};

const refs = {
  monthSelector: document.getElementById('monthSelector'),
  exportDataBtn: document.getElementById('exportDataBtn'),
  importDataBtn: document.getElementById('importDataBtn'),
  clearDataBtn: document.getElementById('clearDataBtn'),
  importDataInput: document.getElementById('importDataInput'),
  totalIncome: document.getElementById('totalIncome'),
  totalGrossIncome: document.getElementById('totalGrossIncome'),
  totalExpense: document.getElementById('totalExpense'),
  totalBalance: document.getElementById('totalBalance'),
  totalInstallments: document.getElementById('totalInstallments'),
  monthTitle: document.getElementById('monthTitle'),
  entriesTableBody: document.getElementById('entriesTableBody'),
  reportContent: document.getElementById('reportContent'),
  reportType: document.getElementById('reportType'),
  reportDate: document.getElementById('reportDate'),
  reportDateField: document.getElementById('reportDateField'),
  reportStatusFilter: document.getElementById('reportStatusFilter'),
  reportEntryTypeFilter: document.getElementById('reportEntryTypeFilter'),
  reportCategoryFilter: document.getElementById('reportCategoryFilter'),
  printReportBtn: document.getElementById('printReportBtn'),
  form: document.getElementById('entryForm'),
  formValidationMessage: document.getElementById('formValidationMessage'),
  formTitle: document.getElementById('formTitle'),
  submitEntryBtn: document.getElementById('submitEntryBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  description: document.getElementById('description'),
  type: document.getElementById('type'),
  category: document.getElementById('category'),
  newCategory: document.getElementById('newCategory'),
  addCategoryBtn: document.getElementById('addCategoryBtn'),
  removeCategoryBtn: document.getElementById('removeCategoryBtn'),
  amount: document.getElementById('amount'),
  amountLabel: document.getElementById('amountLabel'),
  boletoUpdatedAmount: document.getElementById('boletoUpdatedAmount'),
  boletoUpdatedAmountField: document.getElementById('boletoUpdatedAmountField'),
  boletoInterestPreview: document.getElementById('boletoInterestPreview'),
  boletoDueDate: document.getElementById('boletoDueDate'),
  boletoDueDateField: document.getElementById('boletoDueDateField'),
  paidAmount: document.getElementById('paidAmount'),
  paidAmountField: document.getElementById('paidAmountField'),
  paymentMethod: document.getElementById('paymentMethod'),
  cardFeeRate: document.getElementById('cardFeeRate'),
  cardFeeField: document.getElementById('cardFeeField'),
  receiptFile: document.getElementById('receiptFile'),
  receiptStatus: document.getElementById('receiptStatus'),
  removeReceiptBtn: document.getElementById('removeReceiptBtn'),
  receiptDialog: document.getElementById('receiptDialog'),
  receiptPreview: document.getElementById('receiptPreview'),
  receiptPdfPreview: document.getElementById('receiptPdfPreview'),
  paymentStatus: document.getElementById('paymentStatus'),
  date: document.getElementById('date'),
  isInstallment: document.getElementById('isInstallment'),
  advanceInstallment: document.getElementById('advanceInstallment'),
  advanceInstallmentField: document.getElementById('advanceInstallmentField'),
  isRecurring: document.getElementById('isRecurring'),
  installmentsCount: document.getElementById('installmentsCount'),
  recurringMonths: document.getElementById('recurringMonths'),
  startMonth: document.getElementById('startMonth'),
  installmentHelper: document.getElementById('installmentHelper'),
  recurringHelper: document.getElementById('recurringHelper'),
};

initialize();

async function initialize() {
  state.receiptDatabase = await openReceiptDatabase();
  populateMonthSelector();
  populateMonthSelect();
  applyCategoryOptions();
  setDefaultDate(new Date());
  bindEvents();
  loadLocalData();
  refs.reportDate.value = toDateInputValue(new Date());
  togglePaymentFields();
  render();
}

function bindEvents() {
  refs.type.addEventListener('change', applyCategoryOptions);
  refs.addCategoryBtn.addEventListener('click', addCategory);
  refs.removeCategoryBtn.addEventListener('click', removeCategory);
  refs.cancelEditBtn.addEventListener('click', resetEntryForm);
  refs.isInstallment.addEventListener('change', () => {
    if (refs.isInstallment.checked) {
      refs.isRecurring.checked = false;
    }
    toggleInstallmentFields();
    toggleRecurringFields();
  });
  refs.advanceInstallment.addEventListener('change', handleAdvanceInstallmentToggle);
  refs.isRecurring.addEventListener('change', () => {
    if (refs.isRecurring.checked) {
      refs.isInstallment.checked = false;
    }
    toggleInstallmentFields();
    toggleRecurringFields();
  });
  refs.reportType.addEventListener('change', renderReport);
  refs.reportDate.addEventListener('change', renderReport);
  refs.reportStatusFilter.addEventListener('change', renderReport);
  refs.reportEntryTypeFilter.addEventListener('change', renderReport);
  refs.reportCategoryFilter.addEventListener('change', renderReport);
  refs.type.addEventListener('change', togglePaymentFields);
  refs.paymentMethod.addEventListener('change', togglePaymentFields);
  refs.date.addEventListener('change', togglePaymentFields);
  refs.boletoDueDate.addEventListener('change', togglePaymentFields);
  refs.boletoUpdatedAmount.addEventListener('input', updateBoletoInterestPreview);
  refs.amount.addEventListener('input', () => {
    syncPaidAmountDefault();
    updateBoletoInterestPreview();
  });
  refs.receiptFile.addEventListener('change', updateReceiptSelection);
  refs.removeReceiptBtn.addEventListener('click', removeSelectedReceipt);
  refs.receiptDialog.addEventListener('close', closeReceiptPreview);
  refs.form.addEventListener('input', clearFormValidationMessage);
  refs.form.addEventListener('change', clearFormValidationMessage);
  refs.form.addEventListener('submit', handleSubmitForm);
  refs.entriesTableBody.addEventListener('click', handleTableAction);
  refs.entriesTableBody.addEventListener('change', handleStatusToggle);
  refs.printReportBtn.addEventListener('click', () => window.print());
  refs.exportDataBtn.addEventListener('click', exportData);
  refs.importDataBtn.addEventListener('click', () => refs.importDataInput.click());
  refs.importDataInput.addEventListener('change', handleImportData);
  refs.clearDataBtn.addEventListener('click', clearAllData);
}

function loadLocalData() {
  try {
    const storedEntries = JSON.parse(localStorage.getItem(entriesStorageKey) || '[]');
    const storedCategories = JSON.parse(localStorage.getItem(categoriesStorageKey) || '{"income":[],"expense":[]}');
    state.entries = normalizeEntries(Array.isArray(storedEntries) ? storedEntries : []);
    state.customCategories = {
      income: Array.isArray(storedCategories.income) ? storedCategories.income : [],
      expense: Array.isArray(storedCategories.expense) ? storedCategories.expense : []
    };
    applyCategoryOptions();
  } catch (error) {
    console.error('Erro ao carregar dados locais:', error);
    state.entries = [];
    state.customCategories = { income: [], expense: [] };
  }
}

function persistLocalData() {
  localStorage.setItem(entriesStorageKey, JSON.stringify(state.entries));
  localStorage.setItem(categoriesStorageKey, JSON.stringify(state.customCategories));
  refs.paymentMethod.value = 'other';
  refs.cardFeeRate.value = '0';
  refs.boletoUpdatedAmount.value = '';
  refs.boletoDueDate.value = '';
  refs.receiptFile.value = '';
  refs.receiptStatus.textContent = 'Nenhum comprovante anexado.';
  refs.removeReceiptBtn.classList.add('hidden');
  delete refs.form.dataset.receiptId;
}

async function clearAllData() {
  const confirmed = window.confirm(
    'Tem certeza de que deseja apagar todos os movimentos, categorias personalizadas e comprovantes? Esta ação não pode ser desfeita.'
  );
  if (!confirmed) {
    return;
  }

  try {
    await clearReceiptDatabase();
    localStorage.removeItem(entriesStorageKey);
    localStorage.removeItem(categoriesStorageKey);
    state.entries = [];
    state.customCategories = { income: [], expense: [] };
    if (refs.receiptDialog.open) {
      refs.receiptDialog.close();
    }
    closeReceiptPreview();
    resetEntryForm();
    render();
    alert('Todos os dados foram apagados.');
  } catch (error) {
    console.error('Erro ao apagar todos os dados:', error);
    alert('Não foi possível apagar todos os dados. Tente novamente.');
  }
}

async function exportData() {
  const entries = await Promise.all(state.entries.map(async (entry) => {
    if (!entry.receiptId) {
      return entry;
    }

    const receipt = await getReceipt(entry.receiptId);
    return receipt ? { ...entry, receiptData: await blobToDataUrl(receipt) } : entry;
  }));
  const payload = {
    exportedAt: new Date().toISOString(),
    entries
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const fileName = `clinica-financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], fileName, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title: 'Backup do controle financeiro',
        files: [file]
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      throw error;
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleImportData(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const importedEntries = Array.isArray(parsed.entries)
        ? parsed.entries
        : Array.isArray(parsed)
          ? parsed
          : null;

      if (!importedEntries) {
        throw new Error('Estrutura inválida');
      }

      const entriesWithReceipts = await Promise.all(importedEntries.map(async (entry) => {
        if (!entry.receiptData) {
          return entry;
        }

        const receiptId = entry.receiptId || generateId();
        await saveReceipt(receiptId, dataUrlToBlob(entry.receiptData));
        const { receiptData, ...entryWithoutData } = entry;
        return { ...entryWithoutData, receiptId };
      }));
      await saveEntries(normalizeEntries(entriesWithReceipts));
      alert('Dados importados com sucesso.');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      alert('Arquivo inválido. Selecione um backup em formato JSON gerado pelo sistema.');
    } finally {
      refs.importDataInput.value = '';
    }
  };

  reader.readAsText(file);
}

function populateMonthSelector() {
  refs.monthSelector.innerHTML = `
    <div class="year-nav">
      <button class="year-nav-btn" data-year-action="prev" type="button">‹ Ano anterior</button>
      <span class="year-label">${state.currentYear}</span>
      <button class="year-nav-btn" data-year-action="next" type="button">Próximo ano ›</button>
    </div>
    <div class="months-grid">
      ${monthNames.map((month, index) => {
        const isActive = index === state.currentMonth ? 'active' : '';
        return `<button class="month-button ${isActive}" data-month="${index}" type="button">${month}</button>`;
      }).join('')}
    </div>
  `;

  refs.monthSelector.querySelectorAll('.month-button').forEach(button => {
    button.addEventListener('click', () => {
      state.currentMonth = Number(button.dataset.month);
      setDefaultDate();
      render();
    });
  });

  refs.monthSelector.querySelectorAll('[data-year-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.yearAction;
      state.currentYear = action === 'prev' ? state.currentYear - 1 : state.currentYear + 1;
      state.currentMonth = Math.min(state.currentMonth, 11);
      setDefaultDate();
      render();
    });
  });
}

function populateMonthSelect() {
  refs.startMonth.innerHTML = monthNames.map((month, index) => {
    return `<option value="${index}">${month}</option>`;
  }).join('');

  refs.startMonth.value = String(state.currentMonth);
}

function applyCategoryOptions(selectedCategories = getSelectedCategories()) {
  const selectedType = refs.type.value;
  const categories = getCategories(selectedType);
  const selected = new Set(selectedCategories.filter((category) => categories.includes(category)));

  refs.category.replaceChildren(...categories.map((category) => {
    const label = document.createElement('label');
    label.className = 'category-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category;
    checkbox.checked = selected.has(category);
    const name = document.createElement('span');
    name.textContent = category;
    label.append(checkbox, name);
    return label;
  }));

  if (!selected.size && categories.length) {
    refs.category.querySelector('input').checked = true;
  }
}

function getSelectedCategories() {
  return [...refs.category.querySelectorAll('input:checked')].map((checkbox) => checkbox.value);
}

function getCategories(type) {
  const defaultCategories = type === 'income' ? incomeCategories : expenseCategories;
  return [...new Set([...defaultCategories, ...(state.customCategories[type] || [])])];
}

async function addCategory() {
  const category = refs.newCategory.value.trim();
  const selectedType = refs.type.value;
  const selectedCategories = getSelectedCategories();

  if (!category) {
    return;
  }

  if (!getCategories(selectedType).includes(category)) {
    state.customCategories[selectedType].push(category);
    persistLocalData();
  }

  applyCategoryOptions([...selectedCategories, category]);
  populateReportCategoryFilter();
  refs.newCategory.value = '';
}

async function removeCategory() {
  const selectedCategories = getSelectedCategories();
  const selectedType = refs.type.value;
  const defaultCategories = selectedType === 'income' ? incomeCategories : expenseCategories;
  if (selectedCategories.length !== 1) {
    alert('Selecione uma única categoria para remover.');
    return;
  }
  const [category] = selectedCategories;

  if (!category || defaultCategories.includes(category)) {
    alert('As categorias padrão não podem ser removidas.');
    return;
  }

  state.customCategories[selectedType] = state.customCategories[selectedType].filter((item) => item !== category);
  persistLocalData();
  applyCategoryOptions();
  populateReportCategoryFilter();
}

function toggleInstallmentFields() {
  const isInstallment = refs.isInstallment.checked;
  const installmentFields = document.querySelectorAll('.installment-field');

  installmentFields.forEach((field) => {
    field.classList.toggle('hidden', !isInstallment);
  });

  refs.installmentHelper.classList.toggle('hidden', !isInstallment);
  const isEditingInstallment = state.editingEntryId && refs.form.dataset.isInstallment === 'true';
  const isInstallmentTotalAtSale = refs.form.dataset.isInstallmentTotalAtSale === 'true';
  refs.advanceInstallmentField.classList.toggle('hidden', !isEditingInstallment);
  refs.installmentHelper.textContent = isEditingInstallment && refs.advanceInstallment.checked
    ? 'As parcelas deste grupo serão somadas em um único lançamento na data escolhida; as demais serão removidas.'
    : isEditingInstallment && !isInstallmentTotalAtSale
      ? 'As parcelas deste grupo permanecem nos meses originalmente programados.'
      : 'O valor total da venda será contabilizado no mês da venda, sem valores nos meses seguintes.';
}

function handleAdvanceInstallmentToggle() {
  const isEditingInstallment = state.editingEntryId && refs.form.dataset.isInstallment === 'true';
  refs.amount.readOnly = Boolean(isEditingInstallment && refs.advanceInstallment.checked);

  if (isEditingInstallment) {
    if (refs.advanceInstallment.checked) {
      const installmentGroup = getInstallmentGroup(state.editingEntryId);
      refs.amount.value = installmentGroup.reduce((total, entry) => total + Number(entry.amount), 0).toFixed(2);
    } else {
      refs.amount.value = refs.form.dataset.originalInstallmentAmount;
    }
  }

  toggleInstallmentFields();
}

function toggleRecurringFields() {
  const isRecurring = refs.isRecurring.checked;
  document.querySelectorAll('.recurring-field').forEach((field) => {
    field.classList.toggle('hidden', !isRecurring);
  });
  refs.recurringHelper.classList.toggle('hidden', !isRecurring);
}

function togglePaymentFields() {
  const showCardFee = refs.type.value === 'income' && ['credit', 'debit'].includes(refs.paymentMethod.value);
  const isBoleto = refs.paymentMethod.value === 'boleto';
  refs.cardFeeField.classList.toggle('hidden', !showCardFee);
  refs.boletoDueDateField.classList.toggle('hidden', !isBoleto);
  refs.boletoUpdatedAmountField.classList.toggle('hidden', !isBoletoOverdue());
  refs.amountLabel.textContent = isBoleto ? 'Valor do boleto' : 'Valor';
  refs.paidAmountField.classList.toggle('hidden', refs.type.value !== 'income');
  updateBoletoInterestPreview();
  if (refs.type.value === 'income') {
    syncPaidAmountDefault();
  }
}

function isBoletoOverdue() {
  return refs.paymentMethod.value === 'boleto'
    && Boolean(refs.date.value)
    && Boolean(refs.boletoDueDate.value)
    && refs.date.value > refs.boletoDueDate.value;
}

function updateBoletoInterestPreview() {
  if (!isBoletoOverdue()) {
    refs.boletoInterestPreview.textContent = 'O juros será calculado automaticamente.';
    return;
  }

  const originalAmount = Number(refs.amount.value);
  const updatedAmount = Number(refs.boletoUpdatedAmount.value);
  if (!Number.isFinite(originalAmount) || originalAmount <= 0 || !Number.isFinite(updatedAmount) || updatedAmount < originalAmount) {
    refs.boletoInterestPreview.textContent = 'Informe um valor atualizado igual ou maior que o valor do boleto.';
    return;
  }

  refs.boletoInterestPreview.textContent = `Juros/multa calculados: ${formatCurrency(updatedAmount - originalAmount)}.`;
}

function syncPaidAmountDefault() {
  if (refs.type.value === 'income' && !refs.paidAmount.value && refs.amount.value) {
    refs.paidAmount.value = refs.amount.value;
  }
}

function removeSelectedReceipt() {
  refs.receiptFile.value = '';
  delete refs.form.dataset.receiptId;
  refs.receiptStatus.textContent = 'Nenhum comprovante anexado.';
  refs.removeReceiptBtn.classList.add('hidden');
}

function updateReceiptSelection() {
  const [file] = refs.receiptFile.files || [];
  if (file) {
    refs.receiptStatus.textContent = `${file.name} será anexado.`;
    refs.removeReceiptBtn.classList.toggle('hidden', !refs.form.dataset.receiptId);
  }
}

async function openReceiptPreview(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry || !entry.receiptId) {
    return;
  }

  const receipt = await getReceipt(entry.receiptId);
  if (!receipt) {
    alert('O arquivo do comprovante não foi encontrado.');
    return;
  }

  closeReceiptPreview();
  state.receiptObjectUrl = URL.createObjectURL(receipt);
  const isPdf = receipt.type === 'application/pdf';
  refs.receiptPreview.classList.toggle('hidden', isPdf);
  refs.receiptPdfPreview.classList.toggle('hidden', !isPdf);
  if (isPdf) {
    refs.receiptPdfPreview.src = state.receiptObjectUrl;
  } else {
    refs.receiptPreview.src = state.receiptObjectUrl;
  }
  refs.receiptDialog.showModal();
}

function closeReceiptPreview() {
  if (state.receiptObjectUrl) {
    URL.revokeObjectURL(state.receiptObjectUrl);
    state.receiptObjectUrl = null;
  }
  refs.receiptPreview.removeAttribute('src');
  refs.receiptPdfPreview.removeAttribute('src');
}

function setDefaultDate(date = new Date(state.currentYear, state.currentMonth, 1)) {
  const formattedDate = toDateInputValue(date);

  refs.date.value = formattedDate;
  refs.startMonth.value = String(state.currentMonth);
}

async function handleSubmitForm(event) {
  event.preventDefault();
  clearFormValidationMessage();

  const description = refs.description.value.trim();
  const type = refs.type.value;
  const categories = getSelectedCategories();
  const value = Number(refs.amount.value);
  const paidValue = type === 'income' ? Number(refs.paidAmount.value) : value;
  const paymentMethod = refs.paymentMethod.value;
  const boletoDueDate = paymentMethod === 'boleto' ? refs.boletoDueDate.value || null : null;
  const cardFeeRate = type === 'income' && ['credit', 'debit'].includes(paymentMethod)
    ? Math.max(0, Number(refs.cardFeeRate.value) || 0)
    : 0;
  const dateString = refs.date.value;
  const isInstallment = refs.isInstallment.checked;
  const shouldAdvanceInstallment = isInstallment && refs.advanceInstallment.checked;
  const isRecurring = refs.isRecurring.checked;
  const status = refs.paymentStatus.value;
  const installmentsTotal = isInstallment ? Math.max(2, Number(refs.installmentsCount.value || 2)) : 1;
  const recurringMonths = isRecurring ? Math.max(2, Number(refs.recurringMonths.value || 12)) : 1;
  const isOverdueBoleto = isBoletoOverdue();
  const boletoUpdatedAmount = isOverdueBoleto ? Number(refs.boletoUpdatedAmount.value) : null;

  if (!description || !categories.length || !dateString || !Number.isFinite(value) || value <= 0 || !Number.isFinite(paidValue) || paidValue < 0 || paidValue > value || (paymentMethod === 'boleto' && !boletoDueDate) || (isOverdueBoleto && (!Number.isFinite(boletoUpdatedAmount) || boletoUpdatedAmount < value))) {
    showFormValidationMessage('Preencha a descrição, selecione ao menos uma categoria e confira os valores e a data antes de salvar.');
    return;
  }

  if (cardFeeRate > 100) {
    showFormValidationMessage('A taxa do cartão deve estar entre 0% e 100%.');
    return;
  }

  let receiptId = refs.form.dataset.receiptId || null;
  const [receiptFile] = refs.receiptFile.files || [];
  if (receiptFile) {
    try {
      receiptId = receiptId || generateId();
      await saveReceipt(receiptId, await prepareReceipt(receiptFile));
    } catch (error) {
      console.error('Erro ao salvar comprovante:', error);
      alert('Não foi possível salvar o comprovante. Escolha uma imagem ou um PDF válido de até 12 MB.');
      return;
    }
  }

  const baseDate = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    showFormValidationMessage('Informe uma data válida antes de salvar.');
    return;
  }
  const startingMonthIndex = Number(refs.startMonth.value);

  if (state.editingEntryId) {
    try {
      const updatedEntry = {
        id: state.editingEntryId,
        description,
        type,
        categories,
        amount: value,
        paidAmount: paidValue,
        paymentMethod,
        cardFeeRate,
        boletoUpdatedAmount,
        boletoDueDate,
        receiptId,
        date: toDateInputValue(baseDate),
        year: baseDate.getFullYear(),
        monthIndex: baseDate.getMonth(),
        installmentNumber: Number(refs.form.dataset.installmentNumber || 1),
        installmentsTotal: Number(refs.form.dataset.installmentsTotal || 1),
        isInstallment: refs.form.dataset.isInstallment === 'true',
        isRecurring: refs.form.dataset.isRecurring === 'true',
        parentId: refs.form.dataset.parentId || null,
        status
      };

      if (shouldAdvanceInstallment && refs.form.dataset.isInstallment === 'true') {
        await advanceInstallmentGroup(state.editingEntryId, updatedEntry);
      } else {
        await updateEntry(updatedEntry);
      }
    } catch (error) {
      return;
    }
    resetEntryForm();
    state.currentYear = baseDate.getFullYear();
    state.currentMonth = baseDate.getMonth();
    render();
    return;
  }

  if (isRecurring && recurringMonths > 1) {
    await saveEntries(createRecurringEntries({
      description,
      type,
      categories,
      amount: value,
      paidAmount: paidValue,
      paymentMethod,
      cardFeeRate,
      boletoUpdatedAmount,
      boletoDueDate,
      receiptId,
      date: baseDate,
      startingMonthIndex,
      recurringMonths,
      status
    }));
    state.currentYear = baseDate.getFullYear();
  } else if (shouldAdvanceInstallment) {
    await saveEntries([{
      id: generateId(),
      description,
      type,
      categories,
      amount: value,
      paidAmount: paidValue,
      paymentMethod,
      cardFeeRate,
      boletoUpdatedAmount,
      boletoDueDate,
      receiptId,
      date: toDateInputValue(baseDate),
      year: baseDate.getFullYear(),
      monthIndex: baseDate.getMonth(),
      installmentNumber: 1,
      installmentsTotal,
      isInstallment: false,
      isAdvancedInstallment: true,
      isRecurring: false,
      parentId: null,
      status
    }]);
    state.currentYear = baseDate.getFullYear();
    state.currentMonth = baseDate.getMonth();
  } else if (isInstallment && installmentsTotal > 1) {
    const entriesToSave = createInstallmentEntries({
      description,
      type,
      categories,
      amount: value,
      paidAmount: paidValue,
      paymentMethod,
      cardFeeRate,
      boletoUpdatedAmount,
      boletoDueDate,
      receiptId,
      date: baseDate,
      installmentsTotal,
      status
    });

    await saveEntries(entriesToSave);
    state.currentYear = baseDate.getFullYear();
  } else {
    await saveEntries([{
      id: generateId(),
      description,
      type,
      categories,
      amount: value,
      paymentMethod,
      cardFeeRate,
      boletoUpdatedAmount,
      boletoDueDate,
      receiptId,
      date: toDateInputValue(baseDate),
      year: baseDate.getFullYear(),
      monthIndex: baseDate.getMonth(),
      installmentNumber: 1,
      installmentsTotal: 1,
      isInstallment: false,
      parentId: null,
      status
    }]);
    state.currentYear = baseDate.getFullYear();
  }

  refs.form.reset();
  refs.type.value = 'expense';
  refs.paymentStatus.value = 'open';
  refs.paymentMethod.value = 'other';
  refs.cardFeeRate.value = '0';
  refs.receiptFile.value = '';
  refs.receiptStatus.textContent = 'Nenhum comprovante anexado.';
  refs.removeReceiptBtn.classList.add('hidden');
  delete refs.form.dataset.receiptId;
  refs.isInstallment.checked = false;
  refs.advanceInstallment.checked = false;
  refs.isRecurring.checked = false;
  toggleInstallmentFields();
  toggleRecurringFields();
  togglePaymentFields();
  applyCategoryOptions();
  setDefaultDate();
  state.currentMonth = shouldAdvanceInstallment ? baseDate.getMonth() : startingMonthIndex;
  render();
}

function showFormValidationMessage(message) {
  refs.formValidationMessage.textContent = message;
  refs.formValidationMessage.classList.remove('hidden');
  refs.formValidationMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFormValidationMessage() {
  refs.formValidationMessage.textContent = '';
  refs.formValidationMessage.classList.add('hidden');
}

function createInstallmentEntries({ description, type, categories, amount, paidAmount, paymentMethod, cardFeeRate, boletoUpdatedAmount, boletoDueDate, receiptId, date, installmentsTotal, status }) {
  const parentId = generateId();

  return [{
    id: generateId(),
    description,
    type,
    categories,
    amount,
    paidAmount,
    paymentMethod,
    cardFeeRate,
    boletoUpdatedAmount,
    boletoDueDate,
    receiptId,
    date: toDateInputValue(date),
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    installmentNumber: 1,
    installmentsTotal,
    isInstallment: true,
    isInstallmentTotalAtSale: true,
    parentId,
    status
  }];
}

function createRecurringEntries({ description, type, categories, amount, paidAmount, paymentMethod, cardFeeRate, boletoUpdatedAmount, boletoDueDate, receiptId, date, startingMonthIndex, recurringMonths, status }) {
  const startingYear = date.getFullYear();
  const entries = [];
  const parentId = generateId();

  for (let index = 0; index < recurringMonths; index += 1) {
    const totalMonthOffset = startingMonthIndex + index;
    const year = startingYear + Math.floor(totalMonthOffset / 12);
    const monthIndex = totalMonthOffset % 12;
    const targetMonthDate = new Date(year, monthIndex, Math.min(date.getDate(), daysInMonth(year, monthIndex)));

    entries.push({
      id: generateId(),
      description,
      type,
      categories,
      amount,
      paidAmount,
      paymentMethod,
      cardFeeRate,
      boletoUpdatedAmount,
      boletoDueDate,
      receiptId,
      date: toDateInputValue(targetMonthDate),
      year,
      monthIndex,
      installmentNumber: index + 1,
      installmentsTotal: recurringMonths,
      isInstallment: false,
      isRecurring: true,
      parentId,
      status
    });
  }

  return entries;
}

async function handleTableAction(event) {
  const receiptButton = event.target.closest('.receipt-btn');
  const editButton = event.target.closest('.edit-btn');
  const button = event.target.closest('.delete-btn');
  if (receiptButton) {
    await openReceiptPreview(receiptButton.dataset.id);
    return;
  }

  if (editButton) {
    startEditingEntry(editButton.dataset.id);
    return;
  }

  if (!button) {
    return;
  }

  const entryId = button.dataset.id;
  const removedEntry = state.entries.find((entry) => entry.id === entryId);
  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  await removeReceiptIfUnused(removedEntry && removedEntry.receiptId);
  persistLocalData();
  render();
}

function startEditingEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  state.editingEntryId = entry.id;
  refs.formTitle.textContent = 'Editar movimento';
  refs.submitEntryBtn.textContent = 'Salvar alterações';
  refs.cancelEditBtn.classList.remove('hidden');
  refs.description.value = entry.description || '';
  refs.type.value = entry.type;
  applyCategoryOptions(entry.categories || [entry.category]);
  refs.amount.value = entry.amount;
  refs.boletoUpdatedAmount.value = entry.boletoUpdatedAmount || '';
  refs.boletoDueDate.value = entry.boletoDueDate || '';
  refs.paidAmount.value = entry.type === 'income' ? entry.paidAmount : '';
  refs.paymentMethod.value = entry.paymentMethod || 'other';
  refs.cardFeeRate.value = String(entry.cardFeeRate || 0);
  refs.form.dataset.receiptId = entry.receiptId || '';
  refs.receiptFile.value = '';
  refs.receiptStatus.textContent = entry.receiptId ? 'Comprovante atual anexado.' : 'Nenhum comprovante anexado.';
  refs.removeReceiptBtn.classList.toggle('hidden', !entry.receiptId);
  refs.paymentStatus.value = entry.status;
  refs.date.value = entry.date;
  refs.isInstallment.checked = Boolean(entry.isInstallment);
  refs.advanceInstallment.checked = false;
  refs.isRecurring.checked = Boolean(entry.isRecurring);
  refs.isInstallment.disabled = true;
  refs.isRecurring.disabled = true;
  refs.installmentsCount.value = entry.installmentsTotal || 2;
  refs.recurringMonths.value = entry.isRecurring ? entry.installmentsTotal || 12 : 12;
  refs.startMonth.value = String(entry.monthIndex);
  refs.form.dataset.installmentNumber = String(entry.installmentNumber || 1);
  refs.form.dataset.installmentsTotal = String(entry.installmentsTotal || 1);
  refs.form.dataset.isInstallment = String(Boolean(entry.isInstallment));
  refs.form.dataset.isInstallmentTotalAtSale = String(Boolean(entry.isInstallmentTotalAtSale));
  refs.form.dataset.isRecurring = String(Boolean(entry.isRecurring));
  refs.form.dataset.parentId = entry.parentId || '';
  refs.form.dataset.originalInstallmentAmount = String(entry.amount);
  toggleInstallmentFields();
  togglePaymentFields();
  refs.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateEntry(entry) {
  const previousEntry = state.entries.find((currentEntry) => currentEntry.id === entry.id);
  state.entries = normalizeEntries(state.entries.map((currentEntry) => {
    return currentEntry.id === entry.id ? { ...currentEntry, ...entry } : currentEntry;
  }));
  if (previousEntry && previousEntry.receiptId !== entry.receiptId) {
    await removeReceiptIfUnused(previousEntry.receiptId);
  }
  persistLocalData();
}

function getInstallmentGroup(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return [];
  if (!entry.parentId) return [entry];

  return state.entries.filter((item) => item.parentId === entry.parentId && item.isInstallment);
}

async function advanceInstallmentGroup(entryId, updatedEntry) {
  const currentEntry = state.entries.find((entry) => entry.id === entryId);
  const installmentGroup = getInstallmentGroup(entryId);
  if (!currentEntry || !installmentGroup.length) return;

  const groupIds = new Set(installmentGroup.map((entry) => entry.id));
  const previousReceiptIds = [...new Set(installmentGroup.map((entry) => entry.receiptId).filter(Boolean))];
  const advancedEntry = {
    ...currentEntry,
    ...updatedEntry,
    amount: installmentGroup.reduce((total, entry) => total + Number(entry.amount), 0),
    installmentNumber: 1,
    installmentsTotal: Number(currentEntry.installmentsTotal || installmentGroup.length),
    isInstallment: false,
    isAdvancedInstallment: true,
    isRecurring: false,
    parentId: null
  };

  state.entries = normalizeEntries([
    ...state.entries.filter((entry) => !groupIds.has(entry.id)),
    advancedEntry
  ]);
  await Promise.all(previousReceiptIds.map(removeReceiptIfUnused));
  persistLocalData();
}

function resetEntryForm() {
  state.editingEntryId = null;
  refs.form.reset();
  clearFormValidationMessage();
  refs.formTitle.textContent = 'Adicionar movimento';
  refs.submitEntryBtn.textContent = 'Salvar movimento';
  refs.cancelEditBtn.classList.add('hidden');
  refs.type.value = 'expense';
  refs.paymentStatus.value = 'open';
  refs.paymentMethod.value = 'other';
  refs.cardFeeRate.value = '0';
  refs.receiptFile.value = '';
  refs.receiptStatus.textContent = 'Nenhum comprovante anexado.';
  refs.removeReceiptBtn.classList.add('hidden');
  delete refs.form.dataset.receiptId;
  refs.isInstallment.checked = false;
  refs.advanceInstallment.checked = false;
  refs.isRecurring.checked = false;
  refs.isInstallment.disabled = false;
  refs.isRecurring.disabled = false;
  delete refs.form.dataset.installmentNumber;
  delete refs.form.dataset.installmentsTotal;
  delete refs.form.dataset.isInstallment;
  delete refs.form.dataset.isInstallmentTotalAtSale;
  delete refs.form.dataset.isRecurring;
  delete refs.form.dataset.parentId;
  delete refs.form.dataset.originalInstallmentAmount;
  refs.amount.readOnly = false;
  toggleInstallmentFields();
  toggleRecurringFields();
  togglePaymentFields();
  applyCategoryOptions();
  setDefaultDate();
}

async function handleStatusToggle(event) {
  const checkbox = event.target.closest('.paid-toggle');
  if (!checkbox) {
    return;
  }

  const entry = state.entries.find((item) => item.id === checkbox.dataset.id);
  if (!entry) {
    return;
  }

  entry.status = checkbox.checked ? 'paid' : 'open';
  persistLocalData();
  render();
}

function getFilteredEntriesByStatus(entries, statusFilter, categoryFilter = 'all', entryTypeFilter = 'all') {
  return entries.filter((entry) => {
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || (entry.categories || [entry.category]).includes(categoryFilter);
    const matchesEntryType = entryTypeFilter === 'all' || entry.type === entryTypeFilter;
    return matchesStatus && matchesCategory && matchesEntryType;
  });
}

function populateReportCategoryFilter() {
  const selectedCategory = refs.reportCategoryFilter.value || 'all';
  const categories = [...new Set([
    ...incomeCategories,
    ...expenseCategories,
    ...state.customCategories.income,
    ...state.customCategories.expense,
    ...state.entries.flatMap((entry) => entry.categories || [entry.category])
  ])].sort((first, second) => first.localeCompare(second, 'pt-BR'));

  refs.reportCategoryFilter.replaceChildren(
    new Option('Todas as categorias', 'all'),
    ...categories.map((category) => new Option(category, category))
  );
  refs.reportCategoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : 'all';
}

function paymentStatusLabel(status) {
  return status === 'paid' ? 'Pago' : 'Em aberto';
}

function getInstallmentReportLabel(entry) {
  if (!entry.isInstallment && !entry.isInstallmentTotalAtSale && !entry.isAdvancedInstallment) {
    return '';
  }

  return ` • ${entry.installmentsTotal} parcelas`;
}

function formatEntryCategories(entry) {
  return (entry.categories || [entry.category]).map(escapeHtml).join(', ');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function render() {
  renderMonthTabs();
  renderSummary();
  renderEntriesTable();
  renderReport();
  refs.monthTitle.textContent = `${monthNames[state.currentMonth]} ${state.currentYear} • movimentações`;
}

function renderMonthTabs() {
  refs.monthSelector.innerHTML = `
    <div class="year-nav">
      <button class="year-nav-btn" data-year-action="prev" type="button">‹ Ano anterior</button>
      <span class="year-label">${state.currentYear}</span>
      <button class="year-nav-btn" data-year-action="next" type="button">Próximo ano ›</button>
    </div>
    <div class="months-grid">
      ${monthNames.map((month, index) => {
        const isActive = index === state.currentMonth ? 'active' : '';
        return `<button class="month-button ${isActive}" data-month="${index}" type="button">${month}</button>`;
      }).join('')}
    </div>
  `;

  refs.monthSelector.querySelectorAll('.month-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentMonth = Number(button.dataset.month);
      setDefaultDate();
      render();
    });
  });

  refs.monthSelector.querySelectorAll('[data-year-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.yearAction;
      state.currentYear = action === 'prev' ? state.currentYear - 1 : state.currentYear + 1;
      setDefaultDate();
      render();
    });
  });
}

function renderSummary() {
  const currentEntries = state.entries.filter((entry) => entry.year === state.currentYear && entry.monthIndex === state.currentMonth);

  const incomeEntries = currentEntries.filter((entry) => entry.type === 'income');
  const grossIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const income = incomeEntries.reduce((sum, entry) => sum + getEntryNetAmount(entry), 0);

  const expense = currentEntries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + getEntryAmount(entry), 0);

  const balance = income - expense;
  const activeInstallments = state.entries
    .filter((entry) => {
      return (entry.isInstallment || entry.isRecurring)
        && entry.year === state.currentYear
        && entry.monthIndex === state.currentMonth;
    })
    .reduce((total, entry) => total + (entry.isInstallmentTotalAtSale ? Number(entry.installmentsTotal) || 1 : 1), 0);

  refs.totalIncome.textContent = formatCurrency(income);
  refs.totalGrossIncome.textContent = formatCurrency(grossIncome);
  refs.totalExpense.textContent = formatCurrency(expense);
  refs.totalBalance.textContent = formatCurrency(balance);
  refs.totalInstallments.textContent = String(activeInstallments);
}

function renderEntriesTable() {
  const entries = state.entries
    .filter((entry) => entry.year === state.currentYear && entry.monthIndex === state.currentMonth)
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  if (!entries.length) {
    refs.entriesTableBody.innerHTML = '<tr><td colspan="10" class="empty-state">Nenhum movimento cadastrado para este mês.</td></tr>';
    return;
  }

  refs.entriesTableBody.innerHTML = entries.map((entry) => {
    const rowTypeClass = entry.type === 'income' ? 'income' : 'expense';
    const rowAmountClass = entry.type === 'income' ? 'amount-income' : 'amount-expense';
    const installmentLabel = entry.isAdvancedInstallment
      ? `<span class="badge">Adiantamento (${entry.installmentsTotal} parcelas)</span>`
      : entry.isInstallmentTotalAtSale
      ? `<span class="badge">Venda parcelada (${entry.installmentsTotal} parcelas)</span>`
      : entry.isInstallment
      ? `<span class="badge">Parcela ${entry.installmentNumber}/${entry.installmentsTotal}</span>`
      : entry.isRecurring
        ? `<span class="badge">Recorrência ${entry.installmentNumber}/${entry.installmentsTotal}</span>`
        : '';

    return `
      <tr>
        <td>
          <div>${entry.description}</div>
          ${installmentLabel}
          ${entry.receiptId ? `<button class="receipt-btn" data-id="${entry.id}" type="button">Ver comprovante</button>` : ''}
        </td>
        <td>${formatEntryCategories(entry)}</td>
        <td><span class="type-pill ${rowTypeClass}">${entry.type === 'income' ? 'Entrada' : 'Saída'}</span></td>
        <td>${paymentMethods[entry.paymentMethod] || paymentMethods.other}</td>
        <td class="${rowAmountClass}">${formatCurrency(entry.amount)}${entry.boletoUpdatedAmount ? `<small class="fee-details">Atualizado ${formatCurrency(getEntryAmount(entry))}</small>` : ''}${getEntryFee(entry) ? `<small class="fee-details">Líquido ${formatCurrency(getEntryNetAmount(entry))} • taxa ${formatCurrency(getEntryFee(entry))}</small>` : ''}</td>
        <td>${getBoletoInterest(entry) ? `<span class="fee-details">${formatCurrency(getBoletoInterest(entry))}</span>` : '—'}</td>
        <td class="${entry.type === 'income' ? 'amount-income' : ''}">${entry.type === 'income' ? formatCurrency(entry.paidAmount) : '—'}${entry.type === 'income' && entry.paidAmount < entry.amount ? `<small class="fee-details">Pendente ${formatCurrency(entry.amount - entry.paidAmount)}</small>` : ''}</td>
        <td>${formatDate(entry.date)}</td>
        <td>
          <label class="status-toggle">
            <input type="checkbox" class="paid-toggle" data-id="${entry.id}" ${entry.status === 'paid' ? 'checked' : ''} />
            <span>${paymentStatusLabel(entry.status)}</span>
          </label>
        </td>
        <td class="entry-actions">
          <button class="edit-btn" data-id="${entry.id}" type="button">Editar</button>
          <button class="delete-btn" data-id="${entry.id}" type="button">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderReport() {
  populateReportCategoryFilter();
  const reportType = refs.reportType.value;
  const statusFilter = refs.reportStatusFilter.value;
  const categoryFilter = refs.reportCategoryFilter.value;
  const entryTypeFilter = refs.reportEntryTypeFilter.value;
  const isDateRangeReport = reportType === 'day' || reportType === 'week';
  refs.reportDateField.classList.toggle('hidden', !isDateRangeReport);

  if (reportType === 'year') {
    renderAnnualReport(statusFilter, categoryFilter, entryTypeFilter);
    return;
  }

  if (isDateRangeReport) {
    const referenceDate = new Date(`${refs.reportDate.value}T12:00:00`);
    if (Number.isNaN(referenceDate.getTime())) {
      refs.reportContent.innerHTML = '<p class="empty-state">Selecione uma data para gerar o relatório.</p>';
      return;
    }

    const startDate = new Date(referenceDate);
    if (reportType === 'week') {
      const dayOffset = (startDate.getDay() + 6) % 7;
      startDate.setDate(startDate.getDate() - dayOffset);
    }
    const endDate = new Date(startDate);
    if (reportType === 'week') endDate.setDate(endDate.getDate() + 6);
    const startValue = toDateInputValue(startDate);
    const endValue = toDateInputValue(endDate);
    const entries = getFilteredEntriesByStatus(
      state.entries.filter((entry) => entry.date >= startValue && entry.date <= endValue)
        .sort((first, second) => new Date(first.date) - new Date(second.date)),
      statusFilter,
      categoryFilter,
      entryTypeFilter
    );
    const title = reportType === 'day'
      ? `Relatório de ${formatDate(startValue)}`
      : `Relatório semanal: ${formatDate(startValue)} a ${formatDate(endValue)}`;
    renderPeriodReport(entries, title, statusFilter, categoryFilter, entryTypeFilter);
    return;
  }

  const entries = getFilteredEntriesByStatus(
    state.entries
      .filter((entry) => entry.year === state.currentYear && entry.monthIndex === state.currentMonth)
      .sort((first, second) => new Date(first.date) - new Date(second.date)),
    statusFilter,
    categoryFilter,
    entryTypeFilter
  );

  renderPeriodReport(entries, `Relatório de ${monthNames[state.currentMonth]} ${state.currentYear}`, statusFilter, categoryFilter, entryTypeFilter);
}

function renderPeriodReport(entries, title, statusFilter, categoryFilter, entryTypeFilter) {
  const incomeEntries = entries.filter((entry) => entry.type === 'income');
  const expenseEntries = entries.filter((entry) => entry.type === 'expense');

  const totalGrossIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalReceivedIncome = incomeEntries.reduce((sum, entry) => sum + getEntryReceivedAmount(entry), 0);
  const totalFees = incomeEntries.reduce((sum, entry) => sum + getEntryFee(entry), 0);
  const totalIncome = totalGrossIncome - totalFees;
  const totalExpense = expenseEntries.reduce((sum, entry) => sum + getEntryAmount(entry), 0);
  const totalBoletoInterest = expenseEntries.reduce((sum, entry) => sum + getBoletoInterest(entry), 0);

  refs.reportContent.innerHTML = `
    <div class="report-summary-box">
      <h3>${title}${categoryFilter === 'all' ? '' : ` • ${categoryFilter}`}${entryTypeFilter === 'all' ? '' : ` • ${entryTypeFilter === 'income' ? 'Entradas' : 'Saídas'}`}</h3>
      <div class="report-grid">
        <div><strong>Entradas líquidas:</strong> ${formatCurrency(totalIncome)}</div>
        <div><strong>Taxas de cartão:</strong> ${formatCurrency(totalFees)}</div>
        <div><strong>Entradas brutas:</strong> ${formatCurrency(totalGrossIncome)}</div>
        <div><strong>Entradas recebidas:</strong> ${formatCurrency(totalReceivedIncome)}</div>
        <div><strong>Valores pendentes:</strong> ${formatCurrency(totalGrossIncome - totalReceivedIncome)}</div>
        <div><strong>Saídas:</strong> ${formatCurrency(totalExpense)}</div>
        <div><strong>Juros/multas de boletos:</strong> ${formatCurrency(totalBoletoInterest)}</div>
      </div>
    </div>

    <div class="report-grid">
      <div class="report-section">
        <h3>Entradas ${statusFilter === 'all' ? '' : `(${paymentStatusLabel(statusFilter)})`}</h3>
        <ul class="report-list">
          ${incomeEntries.length
            ? incomeEntries.map((entry) => `
                <li class="report-item">
                  <div class="report-item-main">
                    <span class="report-item-name">${entry.description}</span>
                    <small>${formatEntryCategories(entry)} • ${formatDate(entry.date)} • ${paymentMethods[entry.paymentMethod] || paymentMethods.other}${getInstallmentReportLabel(entry)} • ${paymentStatusLabel(entry.status)} • Recebido ${formatCurrency(getEntryReceivedAmount(entry))}${entry.paidAmount < entry.amount ? ` • pendente ${formatCurrency(entry.amount - entry.paidAmount)}` : ''}${getEntryFee(entry) ? ` • taxa ${formatCurrency(getEntryFee(entry))}` : ''}</small>
                  </div>
                  <strong class="amount-income">${formatCurrency(getEntryNetAmount(entry))}</strong>
                </li>
              `).join('')
            : '<li class="report-empty"><span>Sem entradas neste período.</span></li>'}
        </ul>
      </div>
      <div class="report-section">
        <h3>Saídas ${statusFilter === 'all' ? '' : `(${paymentStatusLabel(statusFilter)})`}</h3>
        <ul class="report-list">
          ${expenseEntries.length
            ? expenseEntries.map((entry) => `
                <li class="report-item">
                  <div class="report-item-main">
                    <span class="report-item-name">${entry.description}</span>
                    <small>${formatEntryCategories(entry)} • ${formatDate(entry.date)}${entry.boletoDueDate ? ` • vencimento ${formatDate(entry.boletoDueDate)}` : ''}${entry.boletoUpdatedAmount ? ` • atualizado ${formatCurrency(getEntryAmount(entry))}` : ''}${getInstallmentReportLabel(entry)} • ${paymentStatusLabel(entry.status)}${getBoletoInterest(entry) ? ` • juros/multa ${formatCurrency(getBoletoInterest(entry))}` : ''}</small>
                  </div>
                  <strong class="amount-expense">${formatCurrency(getEntryAmount(entry))}</strong>
                </li>
              `).join('')
            : '<li class="report-empty"><span>Sem saídas neste período.</span></li>'}
        </ul>
      </div>
    </div>
  `;
}

function renderAnnualReport(statusFilter, categoryFilter, entryTypeFilter) {
  const filteredEntries = getFilteredEntriesByStatus(state.entries.filter((entry) => entry.year === state.currentYear), statusFilter, categoryFilter, entryTypeFilter);
  const monthlySummary = monthNames.map((month, index) => {
    const monthEntries = filteredEntries.filter((entry) => entry.monthIndex === index);
    const monthIncome = monthEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + getEntryNetAmount(entry), 0);
    const monthExpense = monthEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + getEntryAmount(entry), 0);

    return {
      month,
      income: monthIncome,
      expense: monthExpense,
      balance: monthIncome - monthExpense
    };
  });

  const totalIncome = monthlySummary.reduce((sum, item) => sum + item.income, 0);
  const totalReceivedIncome = filteredEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + getEntryReceivedAmount(entry), 0);
  const totalFees = filteredEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + getEntryFee(entry), 0);
  const totalExpense = monthlySummary.reduce((sum, item) => sum + item.expense, 0);
  const totalBoletoInterest = filteredEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + getBoletoInterest(entry), 0);
  const totalBalance = totalIncome - totalExpense;
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  refs.reportContent.innerHTML = `
    <div class="report-document">
      <header class="report-document-header">
        <div>
          <p class="report-kicker">Relatório financeiro</p>
          <h3>Clínica Médica</h3>
        </div>
        <div class="report-meta">
          <span>Ano: ${state.currentYear}</span>
          <span>Filtro: ${statusFilter === 'all' ? 'Todos os status' : paymentStatusLabel(statusFilter)} • ${categoryFilter === 'all' ? 'Todas as categorias' : categoryFilter} • ${entryTypeFilter === 'all' ? 'Entradas e saídas' : entryTypeFilter === 'income' ? 'Somente entradas' : 'Somente saídas'}</span>
          <span>Emitido em: ${generatedAt}</span>
        </div>
      </header>

      <div class="report-summary-box">
        <h3>Resumo anual</h3>
        <div class="report-grid">
          <div><strong>Entradas líquidas:</strong> ${formatCurrency(totalIncome)}</div>
          <div><strong>Entradas recebidas:</strong> ${formatCurrency(totalReceivedIncome)}</div>
          <div><strong>Taxas de cartão:</strong> ${formatCurrency(totalFees)}</div>
          <div><strong>Saídas:</strong> ${formatCurrency(totalExpense)}</div>
          <div><strong>Juros/multas de boletos:</strong> ${formatCurrency(totalBoletoInterest)}</div>
          <div><strong>Saldo:</strong> ${formatCurrency(totalBalance)}</div>
          <div><strong>Período:</strong> ${state.currentYear}</div>
        </div>
      </div>

      <div class="report-section">
        <h3>Resumo por mês</h3>
        <div class="annual-table">
          <div class="annual-table-row annual-table-head">
            <span>Mês</span>
            <span>Entradas líquidas</span>
            <span>Saídas</span>
            <span>Saldo</span>
          </div>
          ${monthlySummary.map((item) => `
            <div class="annual-table-row">
              <span>${item.month}</span>
              <span>${formatCurrency(item.income)}</span>
              <span>${formatCurrency(item.expense)}</span>
              <span class="${item.balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(item.balance)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function openReceiptDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(receiptDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(receiptStoreName)) {
        request.result.createObjectStore(receiptStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveReceipt(receiptId, blob) {
  return new Promise((resolve, reject) => {
    const transaction = state.receiptDatabase.transaction(receiptStoreName, 'readwrite');
    transaction.objectStore(receiptStoreName).put(blob, receiptId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function getReceipt(receiptId) {
  return new Promise((resolve, reject) => {
    const request = state.receiptDatabase.transaction(receiptStoreName).objectStore(receiptStoreName).get(receiptId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function deleteReceipt(receiptId) {
  return new Promise((resolve, reject) => {
    const transaction = state.receiptDatabase.transaction(receiptStoreName, 'readwrite');
    transaction.objectStore(receiptStoreName).delete(receiptId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function clearReceiptDatabase() {
  return new Promise((resolve, reject) => {
    const transaction = state.receiptDatabase.transaction(receiptStoreName, 'readwrite');
    transaction.objectStore(receiptStoreName).clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('A limpeza dos comprovantes foi cancelada.'));
  });
}

async function removeReceiptIfUnused(receiptId) {
  if (receiptId && !state.entries.some((entry) => entry.receiptId === receiptId)) {
    await deleteReceipt(receiptId);
  }
}

async function prepareReceipt(file) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (file.size > 12 * 1024 * 1024) {
    throw new Error('O comprovante excede 12 MB.');
  }

  if (isPdf) {
    const pdfHeader = await file.slice(0, 1024).text();
    if (!pdfHeader.includes('%PDF-')) {
      throw new Error('O arquivo não é um PDF válido.');
    }
    return file.slice(0, file.size, 'application/pdf');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('O comprovante precisa ser uma imagem ou um PDF válido.');
  }

  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Não foi possível processar a imagem.'));
    }, 'image/jpeg', 0.88);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [metadata, encodedData] = dataUrl.split(',');
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const binary = atob(encodedData);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

function normalizeEntries(entries) {
  return (entries || []).map((entry) => {
    const { category: legacyCategory, ...entryData } = entry;
    const suppliedCategories = Array.isArray(entry.categories) && entry.categories.length
      ? entry.categories
      : [legacyCategory];
    const categories = [...new Set(
      suppliedCategories
        .filter((category) => typeof category === 'string' && category.trim())
        .map((category) => category.trim())
    )];
    const dateValue = entry.date ? new Date(`${entry.date}T12:00:00`) : new Date();
    const resolvedYear = Number(entry.year) || dateValue.getFullYear();
    const amount = Math.max(0, Number(entry.amount) || 0);
    const legacyBoletoInterest = Math.min(amount, Math.max(0, Number(entry.boletoInterest) || 0));
    const suppliedUpdatedAmount = Number(entry.boletoUpdatedAmount);
    const hasUpdatedAmount = Number.isFinite(suppliedUpdatedAmount) && suppliedUpdatedAmount >= amount;
    const isLegacyOverdueBoleto = entry.paymentMethod === 'boleto' && !hasUpdatedAmount && legacyBoletoInterest > 0;
    const originalBoletoAmount = isLegacyOverdueBoleto ? amount - legacyBoletoInterest : amount;

    return {
      ...entryData,
      categories: categories.length ? categories : ['Outros'],
      amount: originalBoletoAmount,
      year: resolvedYear,
      monthIndex: Number.isInteger(Number(entry.monthIndex)) ? Number(entry.monthIndex) : dateValue.getMonth(),
      status: entry.status === 'paid' ? 'paid' : 'open',
      paymentMethod: entry.paymentMethod || 'other',
      boletoUpdatedAmount: entry.paymentMethod === 'boleto' && (hasUpdatedAmount || isLegacyOverdueBoleto)
        ? (hasUpdatedAmount ? suppliedUpdatedAmount : amount)
        : null,
      boletoDueDate: entry.boletoDueDate || null,
      cardFeeRate: Math.min(100, Math.max(0, Number(entry.cardFeeRate) || 0)),
      paidAmount: entry.type === 'income'
        ? Math.min(originalBoletoAmount, Math.max(0, Number(entry.paidAmount ?? originalBoletoAmount) || 0))
        : originalBoletoAmount
    };
  });
}

function getEntryFee(entry) {
  if (entry.type !== 'income' || !['credit', 'debit'].includes(entry.paymentMethod)) {
    return 0;
  }

  return Number(entry.amount) * Number(entry.cardFeeRate || 0) / 100;
}

function getEntryNetAmount(entry) {
  return Number(entry.amount) - getEntryFee(entry);
}

function getEntryReceivedAmount(entry) {
  return entry.type === 'income' ? Number(entry.paidAmount || 0) : 0;
}

function getEntryAmount(entry) {
  return entry.paymentMethod === 'boleto'
    && entry.boletoUpdatedAmount !== null
    && entry.boletoUpdatedAmount !== ''
    && Number.isFinite(Number(entry.boletoUpdatedAmount))
    ? Number(entry.boletoUpdatedAmount)
    : Number(entry.amount) || 0;
}

function getBoletoInterest(entry) {
  return entry.paymentMethod === 'boleto' && entry.type === 'expense'
    ? Math.max(0, getEntryAmount(entry) - (Number(entry.amount) || 0))
    : 0;
}

async function saveEntries(entries) {
  state.entries = normalizeEntries([
    ...state.entries.filter((currentEntry) => !entries.some((entry) => entry.id === currentEntry.id)),
    ...entries
  ]);
  persistLocalData();
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function toDateInputValue(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
