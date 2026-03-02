// State management
let dashboardState = {
    monitoring: {
        isActive: false,
        cameraOn: false,
        postureStatus: 'Good posture',
        attentionStatus: 'Focused'
    },
    user: {
        email: 'student@example.com'
    },
    courses: {
        'web-dev': { progress: 50, title: 'Web Development' },
        'android-dev': { progress: 0, title: 'Android App Development' }
    },
    quizzes: {
        'web-dev': { available: true, completed: false },
        'android-dev': { available: false, completed: false }
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateMonitoringUI();
    updateCourseProgress();
    updateQuizAvailability();
});

// Navigation functions
function navigateTo(section) {
    console.log(`Navigating to: ${section}`);
    // Simulate navigation
    switch(section) {
        case 'video-courses':
            alert('Navigating to Video Courses...');
            break;
        case 'study-materials':
            alert('Navigating to Study Materials...');
            break;
        case 'profile':
            alert('Navigating to Profile...');
            break;
        case 'reports':
            alert('Navigating to Reports...');
            break;
    }
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('Logging out...');
        // Simulate logout
        setTimeout(() => {
            alert('Logged out successfully');
            // In a real app, this would redirect to login page
        }, 500);
    }
}

// Course continuation
function continueCourse(courseId) {
    const course = dashboardState.courses[courseId];
    console.log(`Continuing course: ${course.title}`);
    alert(`Resuming ${course.title} course...`);
    
    // Simulate progress update
    if (course.progress < 100) {
        course.progress = Math.min(course.progress + 5, 100);
        updateCourseProgress();
        checkQuizUnlock(courseId);
    }
}

// Monitoring functions
function toggleMonitoring() {
    dashboardState.monitoring.isActive = !dashboardState.monitoring.isActive;
    dashboardState.monitoring.cameraOn = dashboardState.monitoring.isActive;
    
    updateMonitoringUI();
    
    if (dashboardState.monitoring.isActive) {
        startMonitoringSimulation();
    } else {
        stopMonitoringSimulation();
    }
}

function updateMonitoringUI() {
    const btn = document.querySelector('.start-monitoring-btn');
    const cameraStatus = document.querySelector('.camera-status');
    const monitoringIndicator = document.querySelector('.monitoring-indicator');
    
    if (dashboardState.monitoring.isActive) {
        btn.innerHTML = '<i class="fas fa-stop"></i> Stop Monitoring';
        btn.classList.add('stop');
        
        cameraStatus.innerHTML = '<i class="fas fa-camera"></i><span>Camera On</span>';
        cameraStatus.style.color = '#4ade80';
        
        monitoringIndicator.classList.remove('inactive');
        monitoringIndicator.classList.add('active');
        monitoringIndicator.innerHTML = '<i class="fas fa-brain"></i><span>Face Monitoring: Active</span>';
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Start Monitoring';
        btn.classList.remove('stop');
        
        cameraStatus.innerHTML = '<i class="fas fa-camera-slash"></i><span>Camera Off</span>';
        cameraStatus.style.color = '#ef4444';
        
        monitoringIndicator.classList.remove('active');
        monitoringIndicator.classList.add('inactive');
        monitoringIndicator.innerHTML = '<i class="fas fa-brain"></i><span>Face Monitoring: Inactive</span>';
    }
}

let monitoringInterval;

function startMonitoringSimulation() {
    console.log('Starting AI monitoring...');
    
    // Simulate real-time status updates
    monitoringInterval = setInterval(() => {
        updateStatusSimulation();
    }, 3000);
}

function stopMonitoringSimulation() {
    console.log('Stopping AI monitoring...');
    clearInterval(monitoringInterval);
    
    // Reset to default status
    dashboardState.monitoring.postureStatus = 'Good posture';
    dashboardState.monitoring.attentionStatus = 'Focused';
    updateStatusDisplay();
}

function updateStatusSimulation() {
    const postureOptions = ['Good posture', 'Slight slouching', 'Good posture', 'Excellent posture'];
    const attentionOptions = ['Focused', 'Very focused', 'Focused', 'Highly concentrated'];
    
    // Random status updates (simulating AI detection)
    if (Math.random() > 0.7) {
        dashboardState.monitoring.postureStatus = postureOptions[Math.floor(Math.random() * postureOptions.length)];
    }
    
    if (Math.random() > 0.6) {
        dashboardState.monitoring.attentionStatus = attentionOptions[Math.floor(Math.random() * attentionOptions.length)];
    }
    
    updateStatusDisplay();
}

function updateStatusDisplay() {
    const postureValue = document.querySelector('.status-item:first-child .status-value');
    const attentionValue = document.querySelector('.status-item:last-child .status-value');
    const postureIndicator = document.querySelector('.status-item:first-child .status-indicator');
    const attentionIndicator = document.querySelector('.status-item:last-child .status-indicator');
    
    postureValue.textContent = dashboardState.monitoring.postureStatus;
    attentionValue.textContent = dashboardState.monitoring.attentionStatus;
    
    // Update indicators based on status
    if (dashboardState.monitoring.postureStatus.includes('Good') || dashboardState.monitoring.postureStatus.includes('Excellent')) {
        postureIndicator.className = 'status-indicator green';
    } else {
        postureIndicator.className = 'status-indicator yellow';
    }
    
    if (dashboardState.monitoring.attentionStatus.includes('Focused') || dashboardState.monitoring.attentionStatus.includes('concentrated')) {
        attentionIndicator.className = 'status-indicator blue';
    } else {
        attentionIndicator.className = 'status-indicator gray';
    }
}

function updateCourseProgress() {
    Object.keys(dashboardState.courses).forEach(courseId => {
        const course = dashboardState.courses[courseId];
        const progressFill = document.querySelector(`.course-card:nth-child(${courseId === 'web-dev' ? 1 : 2}) .progress-fill`);
        const progressText = document.querySelector(`.course-card:nth-child(${courseId === 'web-dev' ? 1 : 2}) .progress-text`);
        
        if (progressFill && progressText) {
            progressFill.style.width = `${course.progress}%`;
            progressText.textContent = `${course.progress}% complete`;
        }
    });
}

function checkQuizUnlock(courseId) {
    const course = dashboardState.courses[courseId];
    
    // Unlock quiz when course progress reaches 25%
    if (course.progress >= 25 && !dashboardState.quizzes[courseId].available) {
        dashboardState.quizzes[courseId].available = true;
        updateQuizAvailability();
    }
}

function updateQuizAvailability() {
    const webDevQuiz = document.querySelector('.quiz-card:nth-child(1)');
    const androidQuiz = document.querySelector('.quiz-card:nth-child(2)');
    
    // Web Development quiz
    if (dashboardState.quizzes['web-dev'].available) {
        webDevQuiz.classList.remove('locked');
        webDevQuiz.classList.add('available');
        webDevQuiz.querySelector('.start-quiz-btn').disabled = false;
        webDevQuiz.querySelector('.start-quiz-btn').innerHTML = 'Start Quiz';
    } else {
        webDevQuiz.classList.add('locked');
        webDevQuiz.classList.remove('available');
        webDevQuiz.querySelector('.start-quiz-btn').disabled = true;
        webDevQuiz.querySelector('.start-quiz-btn').innerHTML = '<i class="fas fa-lock"></i> Locked';
    }
    
    // Android Development quiz
    if (dashboardState.quizzes['android-dev'].available) {
        androidQuiz.classList.remove('locked');
        androidQuiz.classList.add('available');
        androidQuiz.querySelector('.start-quiz-btn').disabled = false;
        androidQuiz.querySelector('.start-quiz-btn').innerHTML = 'Start Quiz';
    } else {
        androidQuiz.classList.add('locked');
        androidQuiz.classList.remove('available');
        androidQuiz.querySelector('.start-quiz-btn').disabled = true;
        androidQuiz.querySelector('.start-quiz-btn').innerHTML = '<i class="fas fa-lock"></i> Locked';
    }
}

function startQuiz(quizId) {
    const quiz = dashboardState.quizzes[quizId];
    
    if (!quiz.available) {
        alert('This quiz is locked. Complete more course content to unlock it.');
        return;
    }
    
    if (quiz.completed) {
        alert('You have already completed this quiz.');
        return;
    }
    
    const course = dashboardState.courses[quizId];
    console.log(`Starting quiz for: ${course.title}`);
    alert(`Starting ${course.title} quiz...\n\nThis will test your knowledge of the course material.`);
    
    // Simulate quiz completion
    setTimeout(() => {
        const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
        alert(`Quiz completed!\n\nYour score: ${score}%\n\nGreat job! Keep up the good work.`);
        dashboardState.quizzes[quizId].completed = true;
    }, 2000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + M for monitoring toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleMonitoring();
    }
    
    // Escape to stop monitoring if active
    if (e.key === 'Escape' && dashboardState.monitoring.isActive) {
        toggleMonitoring();
    }
});

// Auto-save state to localStorage
function saveState() {
    localStorage.setItem('dashboardState', JSON.stringify(dashboardState));
}

function loadState() {
    const saved = localStorage.getItem('dashboardState');
    if (saved) {
        dashboardState = JSON.parse(saved);
        updateMonitoringUI();
        updateCourseProgress();
        updateQuizAvailability();
    }
}

// Save state periodically
setInterval(saveState, 30000); // Every 30 seconds

// Load state on page load
loadState();

// Add yellow indicator style to CSS if not present
const style = document.createElement('style');
style.textContent = `
    .status-indicator.yellow {
        background: #fbbf24;
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
    }
    .status-indicator.gray {
        background: #6b7280;
        box-shadow: 0 0 10px rgba(107, 114, 128, 0.5);
    }
`;
document.head.appendChild(style);