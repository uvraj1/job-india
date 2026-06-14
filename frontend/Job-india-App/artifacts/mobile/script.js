const FAMOUS_JOBS = [
    {
      code: "IAS",
      fullName: "Indian Administrative Service",
      exam: "UPSC CSE",
      accent: "#2563EB",
      icon: "fa-briefcase",
    },
    {
      code: "IPS",
      fullName: "Indian Police Service",
      exam: "UPSC CSE",
      accent: "#16A34A",
      icon: "fa-shield",
    },
    {
      code: "IFS",
      fullName: "Indian Foreign Service",
      exam: "UPSC CSE",
      accent: "#7C3AED",
      icon: "fa-globe",
    },
    {
      code: "ISRO",
      fullName: "ISRO Scientist",
      exam: "ICRB / GATE",
      accent: "#EA580C",
      icon: "fa-rocket",
    },
    {
      code: "RBI",
      fullName: "RBI Grade B Officer",
      exam: "RBI Exam",
      accent: "#0D9488",
      icon: "fa-building-columns",
    }
];

const MOCK_JOBS = [
    {
        id: 1,
        title: "Senior Software Engineer",
        company: "Tech Mahindra",
        location: "Pune, Maharashtra",
        type: "Full-time",
        experience: "5-8 Yrs",
        salary: "₹18L - 25L",
        tags: ["React", "Node.js", "AWS"],
        postedAt: "2 hours ago"
    },
    {
        id: 2,
        title: "Probationary Officer (PO)",
        company: "State Bank of India",
        location: "All India",
        type: "Govt Job",
        experience: "0-2 Yrs",
        salary: "₹8L - 10L",
        tags: ["Banking", "Govt", "Finance"],
        postedAt: "5 hours ago"
    },
    {
        id: 3,
        title: "Product Designer",
        company: "Flipkart",
        location: "Bangalore (Hybrid)",
        type: "Full-time",
        experience: "3-5 Yrs",
        salary: "₹15L - 22L",
        tags: ["Figma", "UI/UX", "Mobile"],
        postedAt: "1 day ago"
    },
    {
        id: 4,
        title: "Data Scientist",
        company: "TCS",
        location: "Remote",
        type: "Full-time",
        experience: "2-4 Yrs",
        salary: "₹12L - 18L",
        tags: ["Python", "Machine Learning", "SQL"],
        postedAt: "2 days ago"
    },
    {
        id: 5,
        title: "Sub Inspector",
        company: "Delhi Police",
        location: "New Delhi",
        type: "Govt Job",
        experience: "Fresher",
        salary: "₹5L - 7L",
        tags: ["Police", "Defense", "Govt"],
        postedAt: "3 days ago"
    },
    {
        id: 6,
        title: "Frontend Developer",
        company: "Zomato",
        location: "Gurgaon",
        type: "Full-time",
        experience: "1-3 Yrs",
        salary: "₹10L - 15L",
        tags: ["React", "JavaScript", "CSS"],
        postedAt: "4 days ago"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderFamousJobs();
    
    // Simulate API fetch delay
    setTimeout(() => {
        renderJobs(MOCK_JOBS);
    }, 800);

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(searchInput.value);
    });
});

function renderFamousJobs() {
    const container = document.getElementById('famousJobsContainer');
    
    FAMOUS_JOBS.forEach((job, index) => {
        const card = document.createElement('div');
        card.className = `job-pill-card`;
        card.innerHTML = `
            <div class="pill-header">
                <div class="icon-box" style="background: ${job.accent}20; color: ${job.accent}">
                    <i class="fa-solid ${job.icon}"></i>
                </div>
                <div class="code-badge" style="background: ${job.accent}">
                    ${job.code}
                </div>
            </div>
            <div class="pill-title">${job.fullName}</div>
            <div class="pill-subtitle" style="color: ${job.accent}">${job.exam}</div>
        `;
        container.appendChild(card);
    });
}

function renderJobs(jobsToRender) {
    const container = document.getElementById('jobsGrid');
    container.innerHTML = ''; // Clear loading spinner

    if (jobsToRender.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No jobs found matching your search.</h3>
            </div>
        `;
        return;
    }

    jobsToRender.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        
        const tagsHtml = job.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        card.innerHTML = `
            <div class="job-card-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-company">${job.company}</div>
                </div>
                <button class="job-save" onclick="this.style.color = 'var(--accent)'">
                    <i class="fa-regular fa-bookmark"></i>
                </button>
            </div>
            
            <div class="job-details">
                <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${job.location}</div>
                <div class="detail-item"><i class="fa-solid fa-briefcase"></i> ${job.experience}</div>
                <div class="detail-item"><i class="fa-regular fa-clock"></i> ${job.type}</div>
            </div>
            
            <div class="job-tags">
                ${tagsHtml}
            </div>
            
            <div class="job-card-footer">
                <div class="job-salary">${job.salary}</div>
                <button class="btn-apply">Apply Now</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function handleSearch(query) {
    const loadingHtml = `
        <div class="loading-spinner" id="loadingSpinner">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Searching...
        </div>
    `;
    document.getElementById('jobsGrid').innerHTML = loadingHtml;

    setTimeout(() => {
        const lowerQuery = query.toLowerCase();
        const filtered = MOCK_JOBS.filter(job => 
            job.title.toLowerCase().includes(lowerQuery) || 
            job.company.toLowerCase().includes(lowerQuery) ||
            job.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
        renderJobs(filtered);
    }, 500);
}
