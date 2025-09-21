
//This is the most important file. It handles all user actions, data storage, and dynamic page updates.

//javascript
document.addEventListener('DOMContentLoaded', () => {
    // Check which page is currently loaded and run the appropriate functions
    const page = window.location.pathname.split("/").pop();

    // Initialize foundational data in localStorage if not present
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('donations')) {
        localStorage.setItem('donations', JSON.stringify([]));
    }

    // --- SHARED FUNCTIONS ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }

    // --- PAGE-SPECIFIC LOGIC ---
    if (page === 'register.html') {
        handleRegistration();
    } else if (page === 'login.html') {
        handleLogin();
    } else if (page === 'donor_dashboard.html') {
        // Protect the route
        if (!sessionStorage.getItem('loggedInUser')) {
            window.location.href = 'login.html';
            return;
        }
        handleDonorDashboard();
    } else if (page === 'ngo_dashboard.html') {
        // Protect the route
        if (!sessionStorage.getItem('loggedInUser')) {
            window.location.href = 'login.html';
            return;
        }
        handleNgoDashboard();
    }
});


// --- FUNCTION DEFINITIONS ---

function handleRegistration() {
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        const errorMessage = document.getElementById('errorMessage');

        const users = JSON.parse(localStorage.getItem('users'));
        
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            errorMessage.textContent = 'An account with this email already exists.';
            errorMessage.style.display = 'block';
            return;
        }

        const newUser = { name, email, password, userType };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Redirect to login page after successful registration
        window.location.href = 'login.html';
    });
}

function handleLogin() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Store user session info
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            
            // Redirect based on user type
            if (user.userType === 'donor') {
                window.location.href = 'donor_dashboard.html';
            } else {
                window.location.href = 'ngo_dashboard.html';
            }
        } else {
            errorMessage.textContent = 'Invalid email or password.';
            errorMessage.style.display = 'block';
        }
    });
}

function handleDonorDashboard() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    document.getElementById('welcomeMessage').textContent = `Welcome, ${loggedInUser.name}!`;

    const donationForm = document.getElementById('donationForm');
    donationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const foodItem = document.getElementById('foodItem').value;
        const quantity = document.getElementById('quantity').value;
        const location = document.getElementById('location').value;
        const successMessage = document.getElementById('successMessage');

        const donations = JSON.parse(localStorage.getItem('donations'));
        const newDonation = {
            id: Date.now(), // Unique ID
            donorEmail: loggedInUser.email,
            donorName: loggedInUser.name,
            foodItem,
            quantity,
            location,
            status: 'available' // Status can be 'available', 'requested', 'collected'
        };
        donations.push(newDonation);
        localStorage.setItem('donations', JSON.stringify(donations));
        
        successMessage.textContent = 'Donation posted successfully!';
        successMessage.style.display = 'block';
        donationForm.reset();
        
        // Hide success message after 3 seconds
        setTimeout(() => { successMessage.style.display = 'none'; }, 3000);

        loadDonorDonations(); // Refresh the list
    });

    loadDonorDonations();
}

function loadDonorDonations() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const allDonations = JSON.parse(localStorage.getItem('donations'));
    const myDonations = allDonations.filter(d => d.donorEmail === loggedInUser.email);
    const myDonationsContainer = document.getElementById('myDonations');
    
    myDonationsContainer.innerHTML = ''; // Clear previous content

    if (myDonations.length === 0) {
        myDonationsContainer.innerHTML = '<p>You have not posted any donations yet.</p>';
        return;
    }
    
    myDonations.forEach(donation => {
        const card = document.createElement('div');
        card.className = 'donation-card';
        card.innerHTML = `
            <h4>${donation.foodItem}</h4>
            <p><strong>Quantity:</strong> ${donation.quantity}</p>
            <p><strong>Location:</strong> ${donation.location}</p>
            <div class="status ${donation.status}">${donation.status.toUpperCase()}</div>
        `;
        myDonationsContainer.appendChild(card);
    });
}

function handleNgoDashboard() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    document.getElementById('welcomeMessage').textContent = `Welcome, ${loggedInUser.name}!`;

    loadAvailableDonations();
}

function loadAvailableDonations() {
    const allDonations = JSON.parse(localStorage.getItem('donations'));
    const availableDonations = allDonations.filter(d => d.status === 'available');
    const availableDonationsContainer = document.getElementById('availableDonations');

    availableDonationsContainer.innerHTML = ''; // Clear previous listings

    if (availableDonations.length === 0) {
        availableDonationsContainer.innerHTML = '<p>No available donations at the moment. Please check back later.</p>';
        return;
    }

    availableDonations.forEach(donation => {
        const card = document.createElement('div');
        card.className = 'donation-card';
        card.innerHTML = `
            <h4>${donation.foodItem}</h4>
            <p><strong>Quantity:</strong> ${donation.quantity}</p>
            <p><strong>Location:</strong> ${donation.location}</p>
            <p><strong>Donor:</strong> ${donation.donorName}</p>
            <button class="btn" data-id="${donation.id}">Request Food</button>
        `;
        availableDonationsContainer.appendChild(card);
    });

    // Add event listeners to the new "Request Food" buttons
    availableDonationsContainer.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const donationId = parseInt(e.target.getAttribute('data-id'));
            const allDonations = JSON.parse(localStorage.getItem('donations'));
            const donationIndex = allDonations.findIndex(d => d.id === donationId);
            
            if(donationIndex !== -1) {
                allDonations[donationIndex].status = 'requested';
                localStorage.setItem('donations', JSON.stringify(allDonations));
                loadAvailableDonations(); // Refresh the list to remove the requested item
            }
        });
    });
}
