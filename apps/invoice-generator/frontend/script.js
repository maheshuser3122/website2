// Invoice Generator Script

// Initialize invoiceData
let invoiceData = {
    companyName: 'MCHARV TECHLABS PRIVATE LIMITED',
    companyAddress: '# 53, Near Sharada School, Jayanna Layout, Attibele, Anekal, Bangalore - 562107',
    companyEmail: 'info@mcharvtechlabs.com',
    companyPhone: '+44 7775000667',
    companyGST: '33AARCM3890L1Z',
    companyPAN: 'AARCM3890L',
    companyCIN: 'U82099KA2023PTC73813',
    billToName: 'M/s A3X LIMITED',
    billToEmail: '',
    billToAddress: '62 Bartholomew Street, Newbury, Berkshire, England, RG14 7BE.',
    billToCompanyNum: '16409419',
    invoiceNumber: '', // Will be set by getCurrentMonthYear() for month number
    invoiceDate: new Date().toISOString().split('T')[0],
    servicePeriod: '', // Will be set by getCurrentMonthYear()
    accountName: 'MCHARV TECHLABS PRIVATE LIMITED',
    accountNumber: '4388650006646',
    bankName: 'ICICI Bank',
    bankBranch: 'Attibele',
    ifscCode: 'ICIC0004388',
    swiftCode: 'ICICNRB002',
    website: 'https://mcharvtechlabs.com/',
    thankYouMsg: 'We appreciate your business. Thank you!',
    gstRate: 0,
    currency: 'USD',
    items: [
        {
            id: 1,
            description: '', // Will be set dynamically
            qty: 1,
            rate: 2000.00
        }
    ]
};

// Get current month name and update invoice number with month
function getCurrentMonthYear() {
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[today.getMonth()];
    const monthNumber = String(today.getMonth() + 1).padStart(2, '0'); // Get month number (01-12)
    const year = today.getFullYear();
    // Update invoice number with current month
    invoiceData.invoiceNumber = `INV-${year}-27-A3X-${monthNumber}`;
    // Update service description dynamically
    invoiceData.items[0].description = `Web Customization and Product Service in ${monthName} ${year}`;
    return `Services for ${monthName} ${year}`;
}

// Set today's date as default and current month
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    document.getElementById('servicePeriod').value = getCurrentMonthYear();
    invoiceData.servicePeriod = getCurrentMonthYear();
    initializeItems();
    generateInvoice();
});

// Switch Tabs Function
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.content-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update nav tabs active state
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    const activeNavTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNavTab) {
        activeNavTab.classList.add('active');
    }
}

// Toggle Form (kept for backward compatibility)
function toggleForm() {
    switchTab('company');
}

// Toggle Items Form (kept for backward compatibility)
function toggleItems() {
    switchTab('items');
}

// Initialize Items Table
function initializeItems() {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';
    
    invoiceData.items.forEach((item, index) => {
        addItemRow(item, index + 1);
    });
}

// Add Item Row
function addItemRow(item, sno) {
    const tbody = document.getElementById('itemsBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${sno}</td>
        <td><input type="text" value="${item.description}" onchange="updateItem(${item.id}, 'description', this.value)"></td>
        <td><input type="number" value="${item.qty}" step="0.01" onchange="updateItem(${item.id}, 'qty', parseFloat(this.value))"></td>
        <td><input type="number" value="${item.rate.toFixed(2)}" step="0.01" onchange="updateItem(${item.id}, 'rate', parseFloat(this.value))"></td>
        <td>${(item.qty * item.rate).toFixed(2)}</td>
        <td><button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
}

// Add New Item
function addItem() {
    const newId = Math.max(...invoiceData.items.map(i => i.id), 0) + 1;
    invoiceData.items.push({
        id: newId,
        description: 'New Service Description',
        qty: 1,
        rate: 0
    });
    initializeItems();
    generateInvoice();
}

// Update Item
function updateItem(id, field, value) {
    const item = invoiceData.items.find(i => i.id === id);
    if (item) {
        item[field] = value;
        initializeItems();
        generateInvoice();
    }
}

// Delete Item
function deleteItem(id) {
    invoiceData.items = invoiceData.items.filter(i => i.id !== id);
    if (invoiceData.items.length === 0) {
        invoiceData.items.push({
            id: 1,
            description: 'Service Description',
            qty: 1,
            rate: 0
        });
    }
    initializeItems();
    generateInvoice();
}

// Update Invoice from Form
function updateInvoice() {
    invoiceData.companyName = document.getElementById('companyName').value;
    invoiceData.companyAddress = document.getElementById('companyAddress').value;
    invoiceData.companyEmail = document.getElementById('companyEmail').value;
    invoiceData.companyPhone = document.getElementById('companyPhone').value;
    invoiceData.companyGST = document.getElementById('companyGST').value;
    invoiceData.companyPAN = document.getElementById('companyPAN').value;
    invoiceData.companyCIN = document.getElementById('companyCIN').value;
    invoiceData.billToName = document.getElementById('billToName').value;
    invoiceData.billToEmail = document.getElementById('billToEmail').value;
    invoiceData.billToAddress = document.getElementById('billToAddress').value;
    invoiceData.billToCompanyNum = document.getElementById('billToCompanyNum').value;
    invoiceData.invoiceNumber = document.getElementById('invoiceNumber').value;
    invoiceData.invoiceDate = document.getElementById('invoiceDate').value;
    invoiceData.servicePeriod = document.getElementById('servicePeriod').value;
    invoiceData.currency = document.getElementById('currency').value;
    invoiceData.accountName = document.getElementById('accountName').value;
    invoiceData.accountNumber = document.getElementById('accountNumber').value;
    invoiceData.bankName = document.getElementById('bankName').value;
    invoiceData.bankBranch = document.getElementById('bankBranch').value;
    invoiceData.ifscCode = document.getElementById('ifscCode').value;
    invoiceData.swiftCode = document.getElementById('swiftCode').value;
    invoiceData.website = document.getElementById('website').value;
    invoiceData.thankYouMsg = document.getElementById('thankYouMsg').value;
    
    generateInvoice();
    alert('Invoice updated successfully!');
}

// Calculate Totals
function calculateTotals() {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const gst = (subtotal * invoiceData.gstRate) / 100;
    const grandTotal = subtotal + gst;
    
    return {
        subtotal: subtotal.toFixed(2),
        gst: gst.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
    };
}

// Convert Number to Words
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
    
    if (num === 0) return 'Zero';
    
    function convert(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
        return '';
    }
    
    let num_int = Math.floor(num);
    let num_decimal = Math.round((num - num_int) * 100);
    
    let words = '';
    let scaleIndex = 0;
    
    while (num_int > 0) {
        if (num_int % 1000 !== 0) {
            words = convert(num_int % 1000) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (words ? ' ' + words : '');
        }
        num_int = Math.floor(num_int / 1000);
        scaleIndex++;
    }
    
    if (num_decimal > 0) {
        words += ' and ' + convert(num_decimal) + ' Cents';
    }
    
    return words;
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get Currency Symbol
function getCurrencySymbol() {
    return invoiceData.currency === 'USD' ? '$' : '₹';
}

// Get Currency Label
function getCurrencyLabel() {
    return invoiceData.currency === 'USD' ? 'USD' : 'INR';
}

// Generate Invoice
function generateInvoice() {
    const totals = calculateTotals();
    const amountWords = numberToWords(parseFloat(totals.grandTotal));
    const currencySymbol = getCurrencySymbol();
    const currencyLabel = getCurrencyLabel();
    
    const itemsHtml = invoiceData.items.map((item, index) => `
        <tr style="border-bottom: 2px solid #3b82f6; ${index % 2 === 0 ? 'background: #f0f9ff;' : 'background: white;'}">
            <td style="padding: 14px 12px; text-align: left; font-weight: 700; color: #1e40af; border: 2px solid #3b82f6; background: linear-gradient(90deg, #dbeafe 0%, transparent 100%);">${index + 1}</td>
            <td style="padding: 14px 12px; text-align: left; color: #1f2937; font-weight: 500; border: 2px solid #3b82f6; line-height: 1.5;" data-editable="itemDesc-${index}">${item.description}</td>
            <td style="padding: 14px 12px; text-align: center; color: #1a365d; font-weight: 700; border: 2px solid #3b82f6;" data-editable="itemQty-${index}">${item.qty}</td>
            <td style="padding: 14px 12px; text-align: right; color: #1a365d; font-weight: 700; border: 2px solid #3b82f6;" data-editable="itemRate-${index}">${currencySymbol}${parseFloat(item.rate).toFixed(2)}</td>
            <td style="padding: 14px 12px; text-align: right; color: #1e40af; font-weight: 800; border: 2px solid #3b82f6; background: linear-gradient(90deg, transparent 0%, #dbeafe 100%);">${currencySymbol}${(item.qty * item.rate).toFixed(2)}</td>
        </tr>
    `).join('');
    
    
    const invoiceHTML = `
        <div style="margin: 0; padding: 10px 14px; background: white; border: 2px solid #1a365d; min-height: 100vh; display: flex; flex-direction: column;">
        <!-- Professional Invoice Header with Logo Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 4px solid #1a365d;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <!-- Company Logo -->
                <img src="./logo.avif" alt="MCHARV TECHLABS" style="width: 70px; height: 70px; border-radius: 12px; box-shadow: 0 4px 16px rgba(30, 64, 175, 0.4); border: 2px solid #3b82f6; object-fit: cover;">
                <div>
                    <div style="font-size: 24px; font-weight: 800; color: #1a365d; margin-bottom: 2px;" data-editable="companyName">${invoiceData.companyName}</div>
                    <div style="font-size: 13px; color: #0f766e; font-weight: 600;">✓ Professional Services & Solutions</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 42px; font-weight: 800; color: #1e40af; letter-spacing: 3px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">INVOICE</div>
                <div style="font-size: 11px; color: #475569; margin-top: 6px;">ID: <strong style="color: #1f2937; font-family: 'Courier New', monospace; letter-spacing: 1px;">${invoiceData.invoiceNumber}</strong></div>
            </div>
        </div>

        <!-- Invoice Metadata with Enhanced Colors -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 18px; background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%); border: 2px solid #3b82f6; border-radius: 8px;">
            <div>
                <div style="font-size: 11px; color: #0c4a6e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">🗓️ Invoice Date</div>
                <div style="font-size: 15px; color: #1a365d; font-weight: 700;">${formatDate(invoiceData.invoiceDate)}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: #0c4a6e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">📅 Service Period</div>
                <div style="font-size: 15px; color: #1a365d; font-weight: 700;" data-editable="servicePeriod">${invoiceData.servicePeriod}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: #065f46; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">✓ Status</div>
                <div style="font-size: 13px; color: #ffffff; font-weight: 700; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 6px 12px; border-radius: 6px; display: inline-block; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">PAYABLE</div>
            </div>
        </div>

        <!-- Company & Billing Information with Enhanced Colors -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); padding: 16px; border-left: 5px solid #0284c7; border-radius: 8px; border: 2px solid #0284c7;">
                <div style="font-size: 12px; font-weight: 800; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">📤 FROM (Service Provider)</div>
                <div style="font-size: 14px; color: #0c4a6e; font-weight: 700; margin-bottom: 4px;">${invoiceData.companyName}</div>
                <div style="font-size: 12px; color: #164e63; margin-bottom: 8px; line-height: 1.6; font-weight: 500;">${invoiceData.companyAddress}</div>
                <div style="border-top: 1px solid #0284c7; padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 11px; color: #0c4a6e; margin-bottom: 3px;"><strong>📧 Email:</strong> <span style="color: #164e63;">${invoiceData.companyEmail}</span></div>
                    <div style="font-size: 11px; color: #0c4a6e; margin-bottom: 3px;"><strong>📞 Phone:</strong> <span style="color: #164e63;">${invoiceData.companyPhone}</span></div>
                    <div style="font-size: 11px; color: #0c4a6e; margin-bottom: 3px;"><strong>🏛️ GST IN:</strong> <span style="color: #164e63; font-family: 'Courier New', monospace;">${invoiceData.companyGST}</span></div>
                    <div style="font-size: 11px; color: #0c4a6e;"><strong>CIN:</strong> <span style="color: #164e63; font-family: 'Courier New', monospace;">${invoiceData.companyCIN}</span></div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%); padding: 16px; border-left: 5px solid #10b981; border-radius: 8px; border: 2px solid #10b981;">
                <div style="font-size: 12px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">📥 BILL TO (Client)</div>
                <div style="font-size: 14px; color: #065f46; font-weight: 700; margin-bottom: 4px;" data-editable="billToName">${invoiceData.billToName}</div>
                <div style="font-size: 12px; color: #166534; margin-bottom: 8px; line-height: 1.6; font-weight: 500;">${invoiceData.billToAddress}</div>
                <div style="border-top: 1px solid #10b981; padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 11px; color: #065f46;"><strong>🏢 Company Reg:</strong> <span style="color: #166534; font-family: 'Courier New', monospace;">${invoiceData.billToCompanyNum}</span></div>
                </div>
            </div>
        </div>
        
        <!-- Line Items Table -->
        <div style="margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: linear-gradient(135deg, #1e40af 0%, #0c4a6e 100%); color: white; box-shadow: 0 4px 8px rgba(30, 64, 175, 0.2);">
                        <th style="padding: 16px 12px; text-align: left; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 5%; border: 2px solid #1e40af;">SNO</th>
                        <th style="padding: 16px 12px; text-align: left; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 55%; border: 2px solid #1e40af;">SERVICE DESCRIPTION</th>
                        <th style="padding: 16px 12px; text-align: center; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 10%; border: 2px solid #1e40af;">QTY</th>
                        <th style="padding: 16px 12px; text-align: right; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 15%; border: 2px solid #1e40af;">RATE (${currencyLabel})</th>
                        <th style="padding: 16px 12px; text-align: right; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 15%; border: 2px solid #1e40af;">AMOUNT (${currencyLabel})</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        
        <!-- Amount Summary Section with Enhanced Colors -->
        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px; margin-bottom: 25px;">
            <div></div>
            <div style="background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border: 2px solid #1e40af; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);">
                <div style="display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 2px solid #3b82f6; background: linear-gradient(90deg, #dbeafe 0%, white 100%);">
                    <span style="font-weight: 700; color: #1a365d; font-size: 13px;">Subtotal</span>
                    <span style="font-weight: 800; color: #1a365d; font-size: 13px;">${currencySymbol}${totals.subtotal}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 2px solid #3b82f6; background: white;">
                    <span style="font-weight: 700; color: #1a365d; font-size: 13px;">GST 0% (Export)</span>
                    <span style="font-weight: 800; color: #1a365d; font-size: 13px;">${currencySymbol}${totals.gst}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 16px 16px; background: linear-gradient(135deg, #1e40af 0%, #0c4a6e 100%); color: white; box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);">
                    <span style="font-weight: 800; font-size: 15px; color: white;">Grand Total</span>
                    <span style="font-weight: 800; font-size: 18px; letter-spacing: 0.5px; color: white;">${currencySymbol}${totals.grandTotal}</span>
                </div>
            </div>
        </div>

        <!-- Amount in Words -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-left: 5px solid #f59e0b; padding: 8px 12px; margin-bottom: 0px; margin-top: 0px; border-radius: 8px; border: 2px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
            <div style="font-size: 11px; color: #92400e; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">📝 Amount in Words</div>
            <div style="font-size: 13px; color: #78350f; font-weight: 700; font-style: italic; line-height: 1.3;">${amountWords}</div>
        </div>

        <!-- Page Break for Bank Details -->
        <div style="page-break-before: always; margin-top: 0px; margin-bottom: 0px; height: 0px;"></div>
        
        <!-- Bank Details Section with Enhanced Styling -->
        <div style="margin-bottom: 25px;">
            <div style="font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px;">💳 Bank Transfer Details</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); padding: 14px; border: 2px solid #0284c7; border-radius: 8px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);">
                    <div style="font-size: 11px; font-weight: 800; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Account Information</div>
                    <div style="font-size: 12px; color: #1a3a52; margin-bottom: 6px; font-weight: 600;"><strong style="color: #0c4a6e;">Account Name:</strong></div>
                    <div style="font-size: 12px; color: #164e63; background: white; padding: 6px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #0284c7; font-weight: 500;">${invoiceData.accountName}</div>
                    
                    <div style="font-size: 12px; color: #1a3a52; margin-bottom: 6px; font-weight: 600;"><strong style="color: #0c4a6e;">Account Number:</strong></div>
                    <div style="font-size: 13px; color: #164e63; background: white; padding: 6px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #0284c7; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 1px;">${invoiceData.accountNumber}</div>
                    
                    <div style="font-size: 12px; color: #1a3a52; margin-bottom: 6px; font-weight: 600;"><strong style="color: #0c4a6e;">IFSC Code:</strong></div>
                    <div style="font-size: 13px; color: #164e63; background: white; padding: 6px; border-radius: 4px; border: 1px solid #0284c7; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 1px;">${invoiceData.ifscCode}</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); padding: 14px; border: 2px solid #059669; border-radius: 8px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);">
                    <div style="font-size: 11px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Bank Information</div>
                    <div style="font-size: 12px; color: #1a4f3d; margin-bottom: 6px; font-weight: 600;"><strong style="color: #065f46;">Bank Name:</strong></div>
                    <div style="font-size: 12px; color: #166534; background: white; padding: 6px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #059669; font-weight: 500;">${invoiceData.bankName}</div>
                    
                    <div style="font-size: 12px; color: #1a4f3d; margin-bottom: 6px; font-weight: 600;"><strong style="color: #065f46;">Branch:</strong></div>
                    <div style="font-size: 12px; color: #166534; background: white; padding: 6px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #059669; font-weight: 500;">${invoiceData.bankBranch}</div>
                    
                    <div style="font-size: 12px; color: #1a4f3d; margin-bottom: 6px; font-weight: 600;"><strong style="color: #065f46;">SWIFT Code:</strong></div>
                    <div style="font-size: 13px; color: #166534; background: white; padding: 6px; border-radius: 4px; border: 1px solid #059669; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 1px;">${invoiceData.swiftCode}</div>
                </div>
            </div>
        </div>
        
        <!-- Terms & Notes Section with Enhanced Colors -->
        <div style="background: linear-gradient(135deg, #f3e8ff 0%, #fef3c7 100%); border-left: 5px solid #8b5cf6; padding: 14px 16px; margin-bottom: 20px; border-radius: 8px; border: 2px solid #8b5cf6; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);">
            <div style="font-size: 12px; font-weight: 800; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">⚠️ Important Terms & Conditions</div>
            <div style="font-size: 12px; color: #6b4226; line-height: 1.6; font-weight: 500;">
                ✓ Please mention <strong style="color: #5b21b6; font-family: 'Courier New', monospace;">Invoice #${invoiceData.invoiceNumber}</strong> in your payment reference<br/>
                ✓ This is a computer-generated invoice and does not require signature<br/>
                ✓ Payment terms: Net 30 days from invoice date
            </div>
        </div>

        <!-- Divider -->
        <div style="border-top: 2px solid #e5e7eb; margin: 25px 0;"></div>

        <!-- Professional Footer with Clickable Link -->
        <div style="text-align: center; background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%); padding: 16px; border-radius: 8px; border: 2px solid #3b82f6; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 6px;">Thank you for your business!</div>
            <div style="font-size: 12px; color: #1a3a52; margin-bottom: 10px; font-weight: 500;">${invoiceData.thankYouMsg}</div>
            <div style="font-size: 12px; color: #0c4a6e; margin-top: 10px; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #0284c7; display: inline-block;">
                🌐 <a href="${invoiceData.website}" style="color: #0284c7; text-decoration: none; font-weight: 700; cursor: pointer;" target="_blank">${invoiceData.website}</a>
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 12px;">
                © ${new Date().getFullYear()} ${invoiceData.companyName}. All rights reserved.
            </div>
        </div>

        <!-- Authorized by section -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div></div>
            <div style="text-align: center;">
                <div style="border-top: 1px solid #1f2937; height: 25px; margin-bottom: 4px;"></div>
                <div style="font-size: 10px; font-weight: 600; color: #1f2937;">Authorized Signature</div>
            </div>
        </div>
        </div>
    `;
    
    document.getElementById('invoicePreview').innerHTML = invoiceHTML;
    
    // Enable inline editing on editable fields
    enableInvoiceEditing();
}

// Print Invoice
function printInvoice() {
    window.print();
}

// Download as PDF
function downloadPDF() {
    const element = document.getElementById('invoicePreview');
    const opt = {
        margin: 10,
        filename: `${invoiceData.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Email Functions
function openEmailModal() {
    const modal = document.getElementById('emailModal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    // Pre-fill with bill-to company email if available
    const billToEmail = invoiceData.billToEmail || '';
    document.getElementById('emailTo').value = billToEmail;
    document.getElementById('emailCC').value = '';
    document.getElementById('emailBCC').value = '';
    document.getElementById('recipientName').value = invoiceData.billToName;
    document.getElementById('emailStatus').innerHTML = '';
    document.getElementById('emailStatus').className = '';
}

function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
    document.getElementById('emailStatus').innerHTML = '';
}

function showEmailStatus(message, type) {
    const statusDiv = document.getElementById('emailStatus');
    statusDiv.textContent = message;
    statusDiv.className = type;
}

async function sendInvoiceEmail() {
    const emailToInput = document.getElementById('emailTo').value.trim();
    const emailCCInput = document.getElementById('emailCC').value.trim();
    const emailBCCInput = document.getElementById('emailBCC').value.trim();
    const recipientName = document.getElementById('recipientName').value.trim();
    
    // Parse comma-separated emails
    const emailTo = emailToInput.split(',').map(email => email.trim()).filter(email => email.length > 0);
    const emailCC = emailCCInput.split(',').map(email => email.trim()).filter(email => email.length > 0);
    const emailBCC = emailBCCInput.split(',').map(email => email.trim()).filter(email => email.length > 0);
    
    if (emailTo.length === 0) {
        showEmailStatus('❌ Please enter at least one recipient email in "To" field', 'error');
        return;
    }
    
    // Validate all emails
    const allEmails = [...emailTo, ...emailCC, ...emailBCC];
    const invalidEmails = allEmails.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
        showEmailStatus(`❌ Invalid email address(es): ${invalidEmails.join(', ')}`, 'error');
        return;
    }
    
    // Show loading status
    const totalRecipients = allEmails.length;
    showEmailStatus(`⏳ Sending invoice to ${totalRecipients} recipient(s)...`, 'info');
    
    try {
        const invoiceHTML = document.getElementById('invoicePreview').innerHTML;
        const totals = calculateTotals();
        const amountWords = numberToWords(parseFloat(totals.grandTotal));
        
        // Send one email with To/CC/BCC
        const response = await fetch('/api/send-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                invoiceHTML: invoiceHTML,
                emailTo: emailTo,
                emailCC: emailCC,
                emailBCC: emailBCC,
                recipientName: recipientName,
                invoiceNumber: invoiceData.invoiceNumber,
                companyName: invoiceData.companyName,
                grandTotal: totals.grandTotal,
                amountInWords: amountWords,
                servicePeriod: invoiceData.servicePeriod
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showEmailStatus(`✅ Invoice sent successfully to ${totalRecipients} recipient(s)`, 'success');
            setTimeout(() => {
                closeEmailModal();
            }, 2000);
        } else {
            const errorMessage = data.message || 'Unknown error occurred';
            showEmailStatus(`❌ Failed to send invoice: ${errorMessage}`, 'error');
        }
    } catch (error) {
        showEmailStatus(`❌ Failed to process email request: ${error.message}`, 'error');
        console.error('Send email error:', error);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// Enable inline editing on invoice fields
function enableInvoiceEditing() {
    const invoicePreview = document.getElementById('invoicePreview');
    
    // Make editable fields
    const editableFields = invoicePreview.querySelectorAll('[data-editable]');
    
    editableFields.forEach(field => {
        field.contentEditable = 'true';
        field.style.cursor = 'text';
        field.style.backgroundColor = '#fffbeb';
        field.style.padding = '4px 6px';
        field.style.borderRadius = '4px';
        field.style.border = '1px dashed #f59e0b';
        
        // Save change when user stops editing
        field.addEventListener('blur', function() {
            const fieldType = this.dataset.editable;
            let newValue = this.textContent.trim();
            
            if (fieldType === 'companyName') {
                invoiceData.companyName = newValue;
            } else if (fieldType === 'billToName') {
                invoiceData.billToName = newValue;
            } else if (fieldType === 'servicePeriod') {
                invoiceData.servicePeriod = newValue;
            } else if (fieldType && fieldType.startsWith('itemDesc-')) {
                const itemIndex = parseInt(fieldType.split('-')[1]);
                if (invoiceData.items[itemIndex]) {
                    invoiceData.items[itemIndex].description = newValue;
                }
            } else if (fieldType && fieldType.startsWith('itemQty-')) {
                const itemIndex = parseInt(fieldType.split('-')[1]);
                if (invoiceData.items[itemIndex]) {
                    const qtyNum = parseInt(newValue) || 1;
                    invoiceData.items[itemIndex].qty = qtyNum;
                }
            } else if (fieldType && fieldType.startsWith('itemRate-')) {
                const itemIndex = parseInt(fieldType.split('-')[1]);
                if (invoiceData.items[itemIndex]) {
                    // Remove currency symbol if present
                    const rateStr = newValue.replace(/[₹$]/g, '').trim();
                    const rateNum = parseFloat(rateStr) || 0;
                    invoiceData.items[itemIndex].rate = rateNum;
                }
            }
            
            // Refresh invoice
            generateInvoice();
        });
        
        // Visual feedback on focus
        field.addEventListener('focus', function() {
            this.style.backgroundColor = '#fef08a';
            this.style.border = '1px solid #f59e0b';
        });
        
        // Handle Enter key to save
        field.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('emailModal');
    if (event.target === modal) {
        closeEmailModal();
    }
}
