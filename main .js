// এই কোডটি কাজ করার জন্য আপনার HTML ফাইলে নিচের আইডি গুলো থাকতে হবে:
// <div id="emailAddress">...</div>
// <div id="inbox">...</div>
// <button id="genBtn">...</button>
// <button id="checkBtn">...</button> (এই কোডে এটি ব্যবহৃত হয়নি, কারণ এটি স্বয়ংক্রিয়)

let currentEmail = null;
let currentPassword = null;
let authToken = null;
const API_BASE_URL = 'https://api.mail.tm';

// HTML এলিমেন্টগুলো সিলেক্ট করা
const emailDiv = document.getElementById('emailAddress');
const inboxDiv = document.getElementById('inbox');
const genBtn = document.getElementById('genBtn');
// checkBtn এই উদাহরণে প্রয়োজন নেই, কারণ আমরা setInterval ব্যবহার করছি।

// একটি র্যান্ডম স্ট্রিং জেনারেট করার ফাংশন (ইউজারনেম ও পাসওয়ার্ডের জন্য)
function generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
}

// ১. একটি নতুন র্যান্ডম ইমেইল জেনারেট করা
async function generateNewEmail() {
    emailDiv.textContent = '...ডোমেইন লোড হচ্ছে...';
    inboxDiv.innerHTML = '<p>নতুন ইমেইল তৈরি হচ্ছে...</p>';
    
    try {
        // ধাপ ১: একটি অ্যাভেইলেবল ডোমেইন পাওয়া
        const domainResponse = await fetch(`${API_BASE_URL}/domains`);
        const domains = await domainResponse.json();
        const domain = domains['hydra:member'][0].domain; // প্রথম ডোমেইনটি নিলাম

        // ধাপ ২: র্যান্ডম ইউজারনেম এবং পাসওয়ার্ড তৈরি করা
        const username = generateRandomString(8);
        currentPassword = generateRandomString(12); // পাসওয়ার্ড সেভ করে রাখা
        currentEmail = `${username}@${domain}`;

        emailDiv.textContent = '...অ্যাকাউন্ট তৈরি হচ্ছে...';

        // ধাপ ৩: অ্যাকাউন্ট তৈরি করা (POST /accounts)
        const accountResponse = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: currentEmail,
                password: currentPassword
            })
        });

        if (!accountResponse.ok) throw new Error('অ্যাকাউন্ট তৈরি করা যায়নি।');

        // ধাপ ৪: অথেন্টিকেশন টোকেন সংগ্রহ করা (POST /token)
        emailDiv.textContent = '...টোকেন সংগ্রহ করা হচ্ছে...';
        const tokenResponse = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: currentEmail,
                password: currentPassword
            })
        });

        const tokenData = await tokenResponse.json();
        authToken = tokenData.token; // টোকেন সেভ করে রাখা

        if (!authToken) throw new Error('টোকেন পাওয়া যায়নি।');

        // সফল হলে ইমেইল দেখানো
        emailDiv.textContent = currentEmail;
        inboxDiv.innerHTML = '<p>ইনবক্স লোড হচ্ছে...</p>';
        
        // প্রথমবার ইনবক্স চেক করা
        checkInbox();
        
        // প্রতি ১০ সেকেন্ড পর পর অটোমেটিক ইনবক্স চেক করা
        setInterval(checkInbox, 10000);

    } catch (error) {
        emailDiv.textContent = 'ত্রুটি হয়েছে। আবার চেষ্টা করুন।';
        console.error('Error generating email:', error);
    }
}

// ২. নির্দিষ্ট ইমেইলের ইনবক্স চেক করা
async function checkInbox() {
    if (!authToken) return; // যদি টোকেন না থাকে, তবে ফাংশন থামিয়ে দেওয়া

    try {
        // ধাপ ৫: টোকেন ব্যবহার করে মেসেজ চেক করা (GET /messages)
        const response = await fetch(`${API_BASE_URL}/messages`, {
            headers: {
                'Authorization': `Bearer ${authToken}` // টোকেন পাঠানো হচ্ছে
            }
        });

        if (!response.ok) {
            // যদি টোকেনের মেয়াদ শেষ হয়ে যায় (unauthorized)
            if (response.status === 401) {
                console.log('টোকেনের মেয়াদ শেষ। নতুন টোকেন নেওয়া হচ্ছে...');
                await getNewToken(); // নতুন টোকেন নেওয়ার চেষ্টা
            }
            return; // অন্য কোনো ত্রুটি হলে চেক করা থামিয়ে দেওয়া
        }

        const data = await response.json();
        const messages = data['hydra:member'];

        if (messages.length === 0) {
            inboxDiv.innerHTML = '<p>আপনার ইনবক্সে কোনো মেইল নেই।</p>';
        } else {
            inboxDiv.innerHTML = ''; // ইনবক্স ক্লিয়ার করা
            
            messages.forEach(message => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';
                msgDiv.innerHTML = `
                    <strong>From:</strong> ${message.from.address} <br>
                    <strong>Subject:</strong> ${message.subject} <br>
                    <strong>Intro:</strong> ${message.intro}
                `;
                inboxDiv.appendChild(msgDiv);
            });
        }
    } catch (error) {
        inboxDiv.innerHTML = '<p>ইনবক্স চেক করতে ত্রুটি হয়েছে।</p>';
        console.error('Error checking inbox:', error);
    }
}

// টোকেনের মেয়াদ শেষ হলে নতুন টোকেন নেওয়ার ফাংশন
async function getNewToken() {
    try {
        const tokenResponse = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: currentEmail,
                password: currentPassword
            })
        });
        const tokenData = await tokenResponse.json();
        authToken = tokenData.token;
    } catch (error) {
        console.error('নতুন টোকেন পেতে ত্রুটি:', error);
        authToken = null; // টোকেন রিসেট করা
        inboxDiv.innerHTML = '<p>সেশন এক্সপায়ার হয়ে গেছে। রিফ্রেশ করুন।</p>';
    }
}


// বাটন ইভেন্ট লিসেনার সেট করা
genBtn.addEventListener('click', generateNewEmail);

// পেজ লোড হলে প্রথমবার একটি ইমেইল জেনারেট করা
generateNewEmail();
