// Transaction history for demonstration
let transactionHistory = [];

// Store the user's previous transaction data
let previousTransaction = null;

// Gemini API Configuration
// --------------------------
// ⚠️ PASTE YOUR GEMINI API KEY BELOW ⚠️ 
const GEMINI_API_KEY = "AIzaSyC4_1A7CLGb1PIuRb2eD0hpMTRSCSnJ8eY";
// --------------------------

// EmailJS Configuration
// --------------------------
// Initialize EmailJS with your User ID (found in Account Settings)
// (function() {
//     // ⚠️ PASTE YOUR EMAILJS USER ID BELOW ⚠️
//     emailjs.init("_lPdTxapYY4eceSQm");
// })();

// ⚠️ IMPORTANT EMAIL CONFIGURATION ⚠️
// - The SENDER email is configured in the EmailJS dashboard
//   (You don't need to set the sender email here in the code)
// - The RECIPIENT email comes from the form input field with id="email"
//   (The user enters their email address to receive notifications)
// - YOUR_SERVICE_ID: Get this from EmailJS dashboard after connecting your email provider
// - YOUR_TEMPLATE_ID: Get this from EmailJS dashboard after creating an email template
const EMAILJS_SERVICE_ID = "service_y1lg449"; // e.g., "service_abcd123"
const EMAILJS_TEMPLATE_ID = "template_oxdsvlv"; // e.g., "template_xyz789"
// --------------------------

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const loader = document.getElementById('loader');
const resultContainer = document.getElementById('resultContainer');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultDetails = document.getElementById('resultDetails');
const transactionHistoryContainer = document.getElementById('transactionHistory');
const notificationPopup = document.getElementById('notificationPopup');
const notificationMessage = document.querySelector('.notification-message');
const notificationIcon = document.querySelector('.notification-icon');
const closeNotification = document.querySelector('.close-notification');

// Initialize with current date time
document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    const datetime = now.toISOString().slice(0, 16);
    document.getElementById('datetime').value = datetime;
    
    // Load sample transaction history
    loadSampleTransactionHistory();
    renderTransactionHistory();
    
    // Check if EmailJS script is loaded
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS is not loaded. Please add the EmailJS script to your HTML.');
        showNotification('medium', 'Email notification system is not available');
    }
});

// Handle form submission
transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const amount = document.getElementById('amount').value;
    const location = document.getElementById('location').value;
    const datetimeStr = document.getElementById('datetime').value;
    const email = document.getElementById('email').value;
    const card = document.getElementById('card').value;
    const description = document.getElementById('description').value;
    
    // Convert datetime string to Date object
    const datetime = new Date(datetimeStr);
    
    // Show loader
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    
    // Analyze transaction
    analyzeTransaction({
        amount,
        location,
        datetime,
        email,
        card,
        description
    });
});

// Close notification handler
closeNotification.addEventListener('click', function() {
    notificationPopup.classList.remove('show');
    setTimeout(() => {
        notificationPopup.classList.add('hidden');
    }, 300);
});

// Fraud detection rules
function isSuspiciousTransaction(transaction) {
    let flags = [];
    let isSuspicious = false;
    
    // Rule 1: Check if transaction is outside normal hours (7am - 9pm)
    const hour = transaction.datetime.getHours();
    if (hour < 7 || hour > 21) {
        flags.push("Transaction made outside normal hours (7am - 9pm)");
        isSuspicious = true;
    }
    
    // Rule 2: Check if location changed drastically in short time
    if (previousTransaction) {
        const timeDiff = (transaction.datetime - previousTransaction.datetime) / (1000 * 60 * 60); // in hours
        
        if (timeDiff < 1 && transaction.location !== previousTransaction.location && 
            !transaction.location.includes(previousTransaction.location) && 
            !previousTransaction.location.includes(transaction.location)) {
            flags.push(`Location changed from ${previousTransaction.location} to ${transaction.location} in less than 1 hour`);
            isSuspicious = true;
        }
    }
    
    // Rule 3: Large amount transaction
    if (transaction.amount > 1000) {
        flags.push("Large transaction amount (over $1,000)");
    }
    
    return {
        isSuspicious,
        flags
    };
}

// Use Gemini API to analyze the transaction
async function analyzeTransaction(transaction) {
    try {
        // First check our basic rules
        const { isSuspicious, flags } = isSuspiciousTransaction(transaction);
        
        // Store as previous transaction for future reference
        previousTransaction = transaction;
        
        // For a real implementation, here's where you would call Gemini API
        // The code below is commented out since you'll add your own API key
        
        /*
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `
                                Analyze this transaction for potential fraud:
                                Amount: $${transaction.amount}
                                Location: ${transaction.location}
                                Time: ${transaction.datetime.toLocaleTimeString()}
                                Date: ${transaction.datetime.toLocaleDateString()}
                                Description: ${transaction.description}
                                
                                Previous transaction info:
                                ${previousTransaction ? 
                                    `Amount: $${previousTransaction.amount}
                                    Location: ${previousTransaction.location}
                                    Time: ${previousTransaction.datetime.toLocaleTimeString()}
                                    Date: ${previousTransaction.datetime.toLocaleDateString()}` 
                                    : 'No previous transaction data'}
                                
                                Consider these suspicious patterns:
                                1. Transaction time is outside 7am-9pm
                                2. Location drastically changed in a short time period
                                3. Unusually large transaction amount
                                
                                Return a JSON with:
                                {
                                    "isFraudulent": boolean (true if likely fraud),
                                    "confidenceScore": number between 0-1,
                                    "riskLevel": "low", "medium", or "high",
                                    "reasoning": array of reasons for the assessment,
                                    "recommendation": string with recommended action
                                }
                                `
                            }
                        ]
                    }
                ]
            })
        });
        
        const data = await response.json();
        const analysisText = data.candidates[0].content.parts[0].text;
        const analysis = JSON.parse(analysisText);
        */
        
        // For demonstration purposes, we'll simulate an API response
        const analysis = simulateGeminiResponse(transaction, flags, isSuspicious);
        
        // Add transaction to history
        addToTransactionHistory(transaction, analysis);
        
        // Display results
        displayResults(transaction, analysis);
        
        // Send email notification if suspicious
        if (analysis.riskLevel !== 'low') {
            sendEmailNotification(transaction, analysis);
        }
        
    } catch (error) {
        console.error('Error analyzing transaction:', error);
        
        // Display error
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>';
        resultTitle.textContent = 'Analysis Error';
        resultMessage.textContent = 'There was an error analyzing this transaction. Please try again.';
        resultDetails.textContent = '';
        
        // Hide loader, show results
        loader.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    }
}

// Simulate a response from Gemini API for demonstration purposes
function simulateGeminiResponse(transaction, flags, isSuspicious) {
    const hour = transaction.datetime.getHours();
    const isLargeAmount = transaction.amount > 1000;
    
    let confidenceScore, riskLevel, reasoning, recommendation;
    
    if (isSuspicious) {
        // High risk if outside hours AND location change
        if ((hour < 7 || hour > 21) && flags.length > 1) {
            confidenceScore = 0.85;
            riskLevel = "high";
            reasoning = [
                ...flags,
                "Multiple fraud indicators detected"
            ];
            recommendation = "Block transaction and contact account holder immediately for verification.";
        } else {
            confidenceScore = 0.65;
            riskLevel = "medium";
            reasoning = flags;
            recommendation = "Flag transaction for review and send verification code to account holder.";
        }
    } else if (isLargeAmount) {
        confidenceScore = 0.35;
        riskLevel = "medium";
        reasoning = [
            "Large transaction amount (over $1,000)",
            "No other suspicious indicators"
        ];
        recommendation = "Process transaction but send confirmation notification to account holder.";
    } else {
        confidenceScore = 0.05;
        riskLevel = "low";
        reasoning = ["No suspicious patterns detected"];
        recommendation = "Process transaction normally.";
    }
    
    return {
        isFraudulent: riskLevel === "high",
        confidenceScore,
        riskLevel,
        reasoning,
        recommendation
    };
}

// Display results on the page
function displayResults(transaction, analysis) {
    // Set appropriate icon
    if (analysis.riskLevel === 'high') {
        resultIcon.innerHTML = '<i class="fas fa-ban" style="color: var(--danger-color);"></i>';
        resultTitle.textContent = 'Potentially Fraudulent Transaction';
    } else if (analysis.riskLevel === 'medium') {
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>';
        resultTitle.textContent = 'Suspicious Transaction';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>';
        resultTitle.textContent = 'Transaction Appears Safe';
    }
    
    // Set message
    resultMessage.textContent = analysis.recommendation;
    
    // Create details section
    let detailsHTML = `
        <div class="detail-item">
            <strong>Risk Level:</strong> 
            <span class="risk-level ${analysis.riskLevel}">${analysis.riskLevel.toUpperCase()}</span>
        </div>
        <div class="detail-item">
            <strong>Confidence Score:</strong> ${Math.round(analysis.confidenceScore * 100)}%
        </div>
        <div class="detail-item">
            <strong>Analysis:</strong>
            <ul class="reasoning-list">
                ${analysis.reasoning.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
        </div>
    `;
    
    resultDetails.innerHTML = detailsHTML;
    
    // Hide loader, show results
    loader.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // Show notification for suspicious transactions
    if (analysis.riskLevel !== 'low') {
        showNotification(analysis.riskLevel, `Transaction alert: ${analysis.recommendation}`);
    }
    
    // Render updated transaction history
    renderTransactionHistory();
}

// Add transaction to history
function addToTransactionHistory(transaction, analysis) {
    const transactionData = {
        id: Date.now(),
        amount: transaction.amount,
        location: transaction.location,
        datetime: transaction.datetime,
        description: transaction.description,
        card: transaction.card,
        status: analysis.riskLevel,
        analysis: analysis
    };
    
    // Add to beginning of array
    transactionHistory.unshift(transactionData);
    
    // Limit history size
    if (transactionHistory.length > 10) {
        transactionHistory.pop();
    }
}

// Render transaction history
function renderTransactionHistory() {
    if (transactionHistory.length === 0) {
        transactionHistoryContainer.innerHTML = '<p class="empty-state">No recent transactions</p>';
        return;
    }
    
    let historyHTML = '';
    
    transactionHistory.forEach(transaction => {
        const formattedDate = new Date(transaction.datetime).toLocaleString();
        const statusClass = transaction.status === 'high' ? 'status-fraudulent' : 
                            transaction.status === 'medium' ? 'status-suspicious' : 'status-safe';
        
        const statusText = transaction.status === 'high' ? 'Fraudulent' : 
                          transaction.status === 'medium' ? 'Suspicious' : 'Safe';
        
        historyHTML += `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${transaction.location}</span> • 
                        <span>${formattedDate}</span> • 
                        <span>Card ending in ${transaction.card}</span>
                    </div>
                </div>
                <div class="transaction-info">
                    <div class="transaction-amount">$${transaction.amount}</div>
                    <span class="transaction-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    });
    
    transactionHistoryContainer.innerHTML = historyHTML;
}

// Show notification popup
function showNotification(type, message) {
    if (type === 'high') {
        notificationIcon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>';
    } else if (type === 'medium') {
        notificationIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>';
    } else {
        notificationIcon.innerHTML = '<i class="fas fa-info-circle" style="color: var(--primary-color);"></i>';
    }
    
    notificationMessage.textContent = message;
    notificationPopup.classList.remove('hidden');
    
    setTimeout(() => {
        notificationPopup.classList.add('show');
    }, 10);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notificationPopup.classList.remove('show');
        setTimeout(() => {
            notificationPopup.classList.add('hidden');
        }, 300);
    }, 5000);
}

// Send real email notification using EmailJS
function sendEmailNotification(transaction, analysis) {
    const templateParams = {
        to_email: transaction.email, // comes from form
        amount: transaction.amount,
        location: transaction.location,
        datetime: transaction.datetime.toLocaleString(),
        description: transaction.description,
        risk_level: analysis.riskLevel,
        confidence_score: Math.round(analysis.confidenceScore * 100) + '%',
        reasoning: analysis.reasoning.join(', '),
        recommendation: analysis.recommendation
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('Email sent successfully:', response.status, response.text);
            showNotification('success', 'Email notification sent to user.');
        }, function(error) {
            console.error('Email sending failed:', error);
            showNotification('danger', 'Email sending failed. Check EmailJS settings.');
        });
}

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Load sample transaction history for demonstration
function loadSampleTransactionHistory() {
    const now = new Date();
    
    transactionHistory = [
        {
            id: 1,
            amount: 75.50,
            location: "New York, USA",
            datetime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            description: "Restaurant Purchase",
            card: "4321",
            status: "low",
            analysis: {
                isFraudulent: false,
                confidenceScore: 0.05,
                riskLevel: "low",
                reasoning: ["No suspicious patterns detected"],
                recommendation: "Process transaction normally."
            }
        },
        {
            id: 2,
            amount: 1299.99,
            location: "Online Store",
            datetime: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
            description: "Electronics Purchase",
            card: "4321",
            status: "medium",
            analysis: {
                isFraudulent: false,
                confidenceScore: 0.35,
                riskLevel: "medium",
                reasoning: ["Large transaction amount (over $1,000)", "No other suspicious indicators"],
                recommendation: "Process transaction but send confirmation notification to account holder."
            }
        },
        {
            id: 3,
            amount: 129.50,
            location: "Boston, USA",
            datetime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
            description: "Grocery Shopping",
            card: "4321",
            status: "low",
            analysis: {
                isFraudulent: false,
                confidenceScore: 0.05,
                riskLevel: "low",
                reasoning: ["No suspicious patterns detected"],
                recommendation: "Process transaction normally."
            }
        }
    ];
}