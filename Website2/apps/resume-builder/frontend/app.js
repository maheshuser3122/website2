// ===== Global Variables =====
let currentStep = 1;
let resumeData = {
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    resumeText: '',
    personalInfo: {},
    experience: [],
    education: [],
    skills: {},
    certifications: '',
    projects: '',
    supportingDocs: {}
};

let uploadedFiles = {
    resume: null,
    resumeFormat: null, // 'docx', 'pdf', 'txt'
    resumeContent: '',
    supporting: [],
    photo: null,        // Profile photo
    photoDataUrl: null  // Base64 photo data for display
};

// Store parsed resume structure for Word export
let parsedResumeStructure = null;

// AI Configuration
let aiConfig = {
    apiKey: '',
    model: 'gpt-4o-mini',
    isConnected: false
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUploads();
    initializeDragAndDrop();
    loadAIConfig();
});

// ===== Step Navigation =====
function nextStep(step) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
        return;
    }

    // Save data from current step
    saveStepData(currentStep);

    // Update progress
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    
    // Hide current section
    document.getElementById(`step${currentStep}`).classList.remove('active');
    
    // Show next section
    currentStep = step;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');

    // Update review if on step 4
    if (currentStep === 4) {
        updateReview();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    // Save data from current step
    saveStepData(currentStep);

    // Update progress
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    
    // Hide current section
    document.getElementById(`step${currentStep}`).classList.remove('active');
    
    // Show previous section
    currentStep = step;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('completed');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Validation =====
function validateStep(step) {
    switch(step) {
        case 1:
            const jobDesc = document.getElementById('jobDescription').value.trim();
            if (!jobDesc) {
                showNotification('Please enter the job description', 'warning');
                document.getElementById('jobDescription').focus();
                return false;
            }
            return true;
        case 2:
            const activeTab = document.querySelector('.tab-content.active').id;
            if (activeTab === 'pasteTab') {
                const resumeText = document.getElementById('resumeText').value.trim();
                if (!resumeText) {
                    showNotification('Please enter your resume content', 'warning');
                    return false;
                }
            } else if (activeTab === 'uploadTab') {
                if (!uploadedFiles.resume) {
                    showNotification('Please upload your resume file', 'warning');
                    return false;
                }
            } else if (activeTab === 'manualTab') {
                const fullName = document.getElementById('fullName').value.trim();
                const email = document.getElementById('email').value.trim();
                if (!fullName || !email) {
                    showNotification('Please fill in at least your name and email', 'warning');
                    return false;
                }
            }
            return true;
        default:
            return true;
    }
}

// ===== Save Step Data =====
function saveStepData(step) {
    switch(step) {
        case 1:
            resumeData.jobTitle = document.getElementById('jobTitle').value.trim();
            resumeData.companyName = document.getElementById('companyName').value.trim();
            resumeData.jobDescription = document.getElementById('jobDescription').value.trim();
            break;
        case 2:
            const activeTab = document.querySelector('.tab-content.active').id;
            if (activeTab === 'pasteTab') {
                resumeData.resumeText = document.getElementById('resumeText').value.trim();
            } else if (activeTab === 'manualTab') {
                saveManualEntryData();
            }
            break;
        case 3:
            resumeData.supportingDocs = {
                linkedin: document.getElementById('linkedinContent').value.trim(),
                coverLetter: document.getElementById('coverLetter').value.trim(),
                achievements: document.getElementById('achievements').value.trim(),
                other: document.getElementById('otherDocs').value.trim()
            };
            break;
    }
}

function saveManualEntryData() {
    resumeData.personalInfo = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        location: document.getElementById('location').value.trim(),
        linkedin: document.getElementById('linkedin').value.trim(),
        portfolio: document.getElementById('portfolio').value.trim()
    };

    resumeData.summary = document.getElementById('summary').value.trim();

    // Save experience entries
    resumeData.experience = [];
    document.querySelectorAll('.experience-entry').forEach(entry => {
        const exp = {
            title: entry.querySelector('.expTitle').value.trim(),
            company: entry.querySelector('.expCompany').value.trim(),
            startDate: entry.querySelector('.expStart').value,
            endDate: entry.querySelector('.expCurrent').checked ? 'Present' : entry.querySelector('.expEnd').value,
            description: entry.querySelector('.expDescription').value.trim()
        };
        if (exp.title || exp.company) {
            resumeData.experience.push(exp);
        }
    });

    // Save education entries
    resumeData.education = [];
    document.querySelectorAll('.education-entry').forEach(entry => {
        const edu = {
            degree: entry.querySelector('.eduDegree').value.trim(),
            institution: entry.querySelector('.eduInstitution').value.trim(),
            year: entry.querySelector('.eduYear').value,
            gpa: entry.querySelector('.eduGPA').value.trim()
        };
        if (edu.degree || edu.institution) {
            resumeData.education.push(edu);
        }
    });

    resumeData.skills = {
        technical: document.getElementById('technicalSkills').value.trim(),
        soft: document.getElementById('softSkills').value.trim()
    };

    resumeData.certifications = document.getElementById('certifications').value.trim();
    resumeData.projects = document.getElementById('projects').value.trim();
}

// ===== Tab Switching =====
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    event.target.classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// ===== Add Experience/Education =====
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const newEntry = document.createElement('div');
    newEntry.className = 'experience-entry';
    newEntry.innerHTML = `
        <div class="form-row">
            <div class="input-group">
                <label>Job Title *</label>
                <input type="text" class="expTitle" placeholder="Software Engineer">
            </div>
            <div class="input-group">
                <label>Company *</label>
                <input type="text" class="expCompany" placeholder="Tech Company Inc.">
            </div>
        </div>
        <div class="form-row">
            <div class="input-group">
                <label>Start Date</label>
                <input type="month" class="expStart">
            </div>
            <div class="input-group">
                <label>End Date</label>
                <input type="month" class="expEnd">
                <label class="checkbox-label">
                    <input type="checkbox" class="expCurrent"> Currently working here
                </label>
            </div>
        </div>
        <div class="input-group">
            <label>Description & Achievements</label>
            <textarea class="expDescription" rows="4" placeholder="• Led team of 5 developers...&#10;• Increased efficiency by 30%..."></textarea>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;
    container.appendChild(newEntry);
}

function addEducation() {
    const container = document.getElementById('educationContainer');
    const newEntry = document.createElement('div');
    newEntry.className = 'education-entry';
    newEntry.innerHTML = `
        <div class="form-row">
            <div class="input-group">
                <label>Degree</label>
                <input type="text" class="eduDegree" placeholder="Bachelor of Science">
            </div>
            <div class="input-group">
                <label>Institution</label>
                <input type="text" class="eduInstitution" placeholder="University Name">
            </div>
        </div>
        <div class="form-row">
            <div class="input-group">
                <label>Graduation Year</label>
                <input type="number" class="eduYear" placeholder="2020" min="1950" max="2030">
            </div>
            <div class="input-group">
                <label>GPA (Optional)</label>
                <input type="text" class="eduGPA" placeholder="3.8/4.0">
            </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;
    container.appendChild(newEntry);
}

// ===== File Upload Handling =====
function initializeFileUploads() {
    // Job description file upload
    const jobDescUpload = document.getElementById('jobDescUpload');
    const jobDescFile = document.getElementById('jobDescFile');
    
    jobDescUpload.addEventListener('click', () => jobDescFile.click());
    jobDescFile.addEventListener('change', (e) => handleFileUpload(e, 'jobDescription'));

    // Resume file upload
    const resumeUpload = document.getElementById('resumeUpload');
    const resumeFile = document.getElementById('resumeFile');
    
    resumeUpload.addEventListener('click', () => resumeFile.click());
    resumeFile.addEventListener('change', (e) => handleResumeUpload(e));

    // Supporting documents upload
    const supportingDocsUpload = document.getElementById('supportingDocsUpload');
    const supportingFiles = document.getElementById('supportingFiles');
    
    supportingDocsUpload.addEventListener('click', () => supportingFiles.click());
    supportingFiles.addEventListener('change', (e) => handleSupportingFilesUpload(e));
}

function initializeDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // Handle dropped files based on which area
                const areaId = area.id;
                if (areaId === 'jobDescUpload') {
                    readFileContent(files[0], 'jobDescription');
                } else if (areaId === 'resumeUpload') {
                    handleResumeFile(files[0]);
                } else if (areaId === 'supportingDocsUpload') {
                    handleSupportingFiles(files);
                }
            }
        });
    });
}

function handleFileUpload(event, targetId) {
    const file = event.target.files[0];
    if (file) {
        readFileContent(file, targetId);
    }
}

function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleResumeFile(file);
    }
}

function handleResumeFile(file) {
    uploadedFiles.resume = file;
    
    // Detect file format
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
        uploadedFiles.resumeFormat = 'docx';
    } else if (fileName.endsWith('.doc')) {
        uploadedFiles.resumeFormat = 'doc';
    } else if (fileName.endsWith('.pdf')) {
        uploadedFiles.resumeFormat = 'pdf';
    } else {
        uploadedFiles.resumeFormat = 'txt';
    }
    
    document.getElementById('uploadedResumeInfo').style.display = 'flex';
    document.getElementById('resumeFileName').textContent = file.name;
    
    // Show format badge
    const formatBadge = document.getElementById('resumeFileFormat');
    formatBadge.textContent = uploadedFiles.resumeFormat.toUpperCase();
    formatBadge.style.display = 'inline-block';
    
    // Read the content based on format
    if (uploadedFiles.resumeFormat === 'docx') {
        readWordDocument(file);
    } else {
        readFileContent(file, 'resumeText');
    }
}

function removeResumeFile() {
    uploadedFiles.resume = null;
    uploadedFiles.resumeFormat = null;
    uploadedFiles.resumeContent = '';
    document.getElementById('uploadedResumeInfo').style.display = 'none';
    document.getElementById('resumeFile').value = '';
    document.getElementById('resumeText').value = '';
}

// ===== Photo Upload Handling =====
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file (JPG, PNG, etc.)', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
    }
    
    uploadedFiles.photo = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedFiles.photoDataUrl = e.target.result;
        
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Profile Photo">`;
        
        document.getElementById('removePhotoBtn').style.display = 'inline-flex';
        showNotification('Photo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    uploadedFiles.photo = null;
    uploadedFiles.photoDataUrl = null;
    
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>No photo</span>
    `;
    
    document.getElementById('photoFile').value = '';
    document.getElementById('removePhotoBtn').style.display = 'none';
    showNotification('Photo removed', 'info');
}

function handleSupportingFilesUpload(event) {
    const files = event.target.files;
    handleSupportingFiles(files);
}

function handleSupportingFiles(files) {
    const filesList = document.getElementById('supportingFilesList');
    
    Array.from(files).forEach(file => {
        uploadedFiles.supporting.push(file);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <button class="remove-file" onclick="removeSupportingFile(this, '${file.name}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        filesList.appendChild(fileItem);
    });
}

function removeSupportingFile(button, fileName) {
    uploadedFiles.supporting = uploadedFiles.supporting.filter(f => f.name !== fileName);
    button.parentElement.remove();
}

function readFileContent(file, targetId) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.value = content;
        }
        
        uploadedFiles.resumeContent = content;
        showNotification(`File "${file.name}" loaded successfully`, 'success');
    };

    reader.onerror = function() {
        showNotification('Error reading file', 'error');
    };

    // Handle different file types
    if (file.type === 'application/pdf') {
        // For PDF, we'll show a message (full PDF parsing would require a library)
        showNotification('PDF uploaded. For best results, paste the text content directly.', 'info');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.value = `[PDF File: ${file.name}]\n\nNote: Please paste the text content from your PDF for better processing.`;
        }
    } else {
        reader.readAsText(file);
    }
}

// ===== Word Document Handling =====
function readWordDocument(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        
        // Use mammoth.js to extract text from Word document
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                const text = result.value;
                uploadedFiles.resumeContent = text;
                document.getElementById('resumeText').value = text;
                
                showNotification(`Word document "${file.name}" loaded successfully! Your updated resume will be available as a Word download.`, 'success');
            })
            .catch(function(error) {
                console.error('Error reading Word document:', error);
                showNotification('Error reading Word document. Please try pasting the content instead.', 'error');
            });
        
        // Also extract with formatting for better parsing
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                uploadedFiles.resumeHtml = result.value;
            });
    };
    
    reader.readAsArrayBuffer(file);
}

// ===== Update Review =====
function updateReview() {
    document.getElementById('reviewJobTitle').textContent = resumeData.jobTitle || 'Not specified';
    document.getElementById('reviewCompany').textContent = resumeData.companyName || 'Not specified';
    document.getElementById('reviewJobDesc').textContent = resumeData.jobDescription ? 
        `${resumeData.jobDescription.substring(0, 100)}...` : 'Not provided';
    
    const resumeSource = resumeData.resumeText ? 'Text provided' : 
        (uploadedFiles.resume ? `File: ${uploadedFiles.resume.name}` : 
        (resumeData.personalInfo.fullName ? 'Manual entry' : 'Not provided'));
    document.getElementById('reviewResume').textContent = resumeSource;
}

// ===== Generate Resume =====
async function generateResume() {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    const aiProgress = document.getElementById('aiProgress');
    const progressFill = document.getElementById('aiProgressFill');
    const progressSteps = document.getElementById('aiProgressSteps');
    const loadingTitle = document.getElementById('loadingTitle');
    
    loadingOverlay.classList.add('active');
    
    const useAI = document.getElementById('useAI').checked && aiConfig.isConnected;
    
    if (useAI) {
        // AI-powered generation with progress tracking
        loadingTitle.textContent = 'AI is Analyzing & Optimizing Your Resume...';
        aiProgress.style.display = 'block';
        
        const steps = [
            { id: 'analyze', text: 'Deep analyzing job requirements & keywords', icon: 'fa-search', duration: 2000 },
            { id: 'extract', text: 'Extracting required skills, tools & qualifications', icon: 'fa-key', duration: 1500 },
            { id: 'match', text: 'Mapping your experience to job requirements', icon: 'fa-link', duration: 1500 },
            { id: 'rewrite', text: 'AI rewriting bullets with job keywords', icon: 'fa-pen', duration: 3000 },
            { id: 'optimize', text: 'Optimizing for ATS keyword matching', icon: 'fa-robot', duration: 1500 },
            { id: 'quantify', text: 'Adding metrics & quantifiable achievements', icon: 'fa-chart-line', duration: 1000 },
            { id: 'format', text: 'Generating final tailored resume', icon: 'fa-file-alt', duration: 1000 }
        ];
        
        progressSteps.innerHTML = steps.map(s => 
            `<div class="ai-step" id="step-${s.id}"><i class="fas ${s.icon}"></i> ${s.text}</div>`
        ).join('');
        
        try {
            let aiResume = null;
            
            // Animate through steps with actual AI calls at appropriate points
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                document.getElementById(`step-${step.id}`).classList.add('active');
                progressFill.style.width = `${((i + 0.5) / steps.length) * 100}%`;
                document.getElementById('loadingText').textContent = step.text + '...';
                
                if (step.id === 'rewrite') {
                    // Main AI call happens here
                    const resumeContent = resumeData.resumeText || uploadedFiles.resumeContent || buildResumeFromManualEntry();
                    
                    const options = {
                        tone: document.getElementById('toneSelect').value,
                        optimizeATS: document.getElementById('optimizeATS').checked,
                        includeKeywords: document.getElementById('includeKeywords').checked,
                        quantifyAchievements: document.getElementById('quantifyAchievements').checked,
                        rewriteBullets: document.getElementById('rewriteBullets').checked
                    };
                    
                    aiResume = await generateResumeWithAI(
                        resumeContent,
                        resumeData.jobDescription,
                        options
                    );
                    
                    // Store AI result
                    parsedResumeStructure = aiResume;
                } else {
                    // Simulated delay for other steps
                    await new Promise(resolve => setTimeout(resolve, step.duration));
                }
                
                document.getElementById(`step-${step.id}`).classList.remove('active');
                document.getElementById(`step-${step.id}`).classList.add('completed');
                document.getElementById(`step-${step.id}`).innerHTML = 
                    `<i class="fas fa-check-circle"></i> ${step.text}`;
                
                progressFill.style.width = `${((i + 1) / steps.length) * 100}%`;
            }
            
            // Use job analysis from AI for better keyword display
            const jobAnalysis = aiResume?._jobAnalysis;
            const keywords = {
                found: [
                    ...(jobAnalysis?.requiredSkills || []),
                    ...(jobAnalysis?.mustHaveKeywords || []),
                    ...(jobAnalysis?.toolsAndTechnologies || []),
                    ...(jobAnalysis?.softSkills || [])
                ].slice(0, 25), // Limit to 25 keywords
                missing: []
            };
            
            // If no job analysis, fall back to basic extraction
            if (!keywords.found.length) {
                const basicKeywords = extractKeywords(resumeData.jobDescription);
                keywords.found = basicKeywords.found;
            }
            
            // Display the result
            displayGeneratedResume({
                parsedResume: parsedResumeStructure,
                keywords: keywords,
                options: {
                    template: document.getElementById('templateSelect').value,
                    tone: document.getElementById('toneSelect').value
                }
            });
            
            // Show result section
            loadingOverlay.classList.remove('active');
            document.getElementById('step4').classList.remove('active');
            document.getElementById('resultSection').style.display = 'block';
            document.getElementById('resultSection').classList.add('active');
            document.querySelector('.progress-step[data-step="4"]').classList.add('completed');
            
            showNotification('AI-optimized resume generated! Review the tailored content below.', 'success');
            
        } catch (error) {
            loadingOverlay.classList.remove('active');
            console.error('AI Error:', error);
            showNotification('AI generation failed: ' + error.message + '. Trying basic mode...', 'error');
            
            // Fall back to non-AI generation
            generateResumeBasic();
        }
    } else {
        // Basic generation without AI
        generateResumeBasic();
    }
}

function generateResumeBasic() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const aiProgress = document.getElementById('aiProgress');
    const loadingTitle = document.getElementById('loadingTitle');
    
    loadingTitle.textContent = 'Generating Your Resume...';
    aiProgress.style.display = 'none';
    
    // Simulate processing steps
    const loadingTexts = [
        'Analyzing job requirements...',
        'Extracting key skills...',
        'Matching your experience...',
        'Formatting resume...'
    ];

    let textIndex = 0;
    const loadingInterval = setInterval(() => {
        document.getElementById('loadingText').textContent = loadingTexts[textIndex];
        textIndex++;
        if (textIndex >= loadingTexts.length) {
            textIndex = 0;
        }
    }, 800);

    // Process and generate resume
    setTimeout(() => {
        clearInterval(loadingInterval);
        loadingOverlay.classList.remove('active');
        
        // Generate the resume
        const generatedResume = processAndGenerateResume();
        
        // Display the result
        displayGeneratedResume(generatedResume);
        
        // Show result section
        document.getElementById('step4').classList.remove('active');
        document.getElementById('resultSection').style.display = 'block';
        document.getElementById('resultSection').classList.add('active');
        
        // Update progress
        document.querySelector('.progress-step[data-step="4"]').classList.add('completed');
        
        showNotification('Resume generated! Enable AI for better optimization.', 'info');
    }, 3000);
}

function buildResumeFromManualEntry() {
    let content = '';
    
    if (resumeData.personalInfo.fullName) {
        content += `Name: ${resumeData.personalInfo.fullName}\n`;
        content += `Email: ${resumeData.personalInfo.email || ''}\n`;
        content += `Phone: ${resumeData.personalInfo.phone || ''}\n`;
        content += `Location: ${resumeData.personalInfo.location || ''}\n\n`;
    }
    
    if (resumeData.summary) {
        content += `SUMMARY:\n${resumeData.summary}\n\n`;
    }
    
    if (resumeData.experience && resumeData.experience.length > 0) {
        content += `EXPERIENCE:\n`;
        resumeData.experience.forEach(exp => {
            content += `${exp.title} at ${exp.company}\n`;
            content += `${exp.startDate} - ${exp.endDate}\n`;
            content += `${exp.description}\n\n`;
        });
    }
    
    if (resumeData.education && resumeData.education.length > 0) {
        content += `EDUCATION:\n`;
        resumeData.education.forEach(edu => {
            content += `${edu.degree} - ${edu.institution} (${edu.year})\n`;
        });
        content += '\n';
    }
    
    if (resumeData.skills.technical || resumeData.skills.soft) {
        content += `SKILLS:\n`;
        content += `Technical: ${resumeData.skills.technical || ''}\n`;
        content += `Soft: ${resumeData.skills.soft || ''}\n\n`;
    }
    
    if (resumeData.certifications) {
        content += `CERTIFICATIONS:\n${resumeData.certifications}\n\n`;
    }
    
    if (resumeData.projects) {
        content += `PROJECTS:\n${resumeData.projects}\n`;
    }
    
    return content;
}

function processAndGenerateResume() {
    // Extract keywords from job description
    const keywords = extractKeywords(resumeData.jobDescription);
    
    // Parse resume content
    let parsedResume;
    if (resumeData.personalInfo.fullName) {
        parsedResume = resumeData;
    } else {
        parsedResume = parseResumeText(resumeData.resumeText);
    }
    
    // Get options
    const optimizeATS = document.getElementById('optimizeATS').checked;
    const includeKeywords = document.getElementById('includeKeywords').checked;
    const quantifyAchievements = document.getElementById('quantifyAchievements').checked;
    const template = document.getElementById('templateSelect').value;
    const tone = document.getElementById('toneSelect').value;

    return {
        parsedResume,
        keywords,
        options: { optimizeATS, includeKeywords, quantifyAchievements, template, tone }
    };
}

function extractKeywords(jobDescription) {
    // Common technical skills and keywords to look for
    const commonKeywords = [
        'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'nodejs',
        'sql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'agile', 'scrum',
        'leadership', 'communication', 'problem-solving', 'teamwork', 'project management',
        'data analysis', 'machine learning', 'ai', 'cloud', 'devops', 'ci/cd',
        'rest api', 'microservices', 'database', 'mongodb', 'postgresql', 'mysql',
        'git', 'github', 'testing', 'qa', 'automation', 'excel', 'powerpoint',
        'marketing', 'sales', 'customer service', 'analytics', 'seo', 'content',
        'design', 'ux', 'ui', 'figma', 'photoshop', 'illustrator'
    ];

    const text = jobDescription.toLowerCase();
    const found = [];
    const missing = [];

    commonKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            found.push(keyword);
        }
    });

    // Also extract custom keywords (words that appear multiple times)
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    Object.entries(wordCount)
        .filter(([word, count]) => count >= 2 && !found.includes(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([word]) => {
            if (!['with', 'that', 'have', 'this', 'will', 'from', 'they', 'been', 'were', 'said'].includes(word)) {
                found.push(word);
            }
        });

    return { found, missing };
}

function parseResumeText(text) {
    // Simple parsing of pasted resume text
    const lines = text.split('\n').filter(line => line.trim());
    
    const parsed = {
        personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            location: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: { technical: '', soft: '' },
        certifications: '',
        projects: ''
    };

    // Try to extract name (usually first line)
    if (lines.length > 0) {
        parsed.personalInfo.fullName = lines[0].trim();
    }

    // Try to extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
        parsed.personalInfo.email = emailMatch[0];
    }

    // Try to extract phone
    const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
    if (phoneMatch) {
        parsed.personalInfo.phone = phoneMatch[0];
    }

    // Store the raw text for display
    parsed.rawText = text;

    return parsed;
}

function displayGeneratedResume(data) {
    const { parsedResume, keywords, options } = data;
    const preview = document.getElementById('resumePreview');
    
    // Store the parsed structure for Word export
    parsedResumeStructure = parsedResume;
    
    // Generate HTML based on template
    let html = generateResumeHTML(parsedResume, options);
    preview.innerHTML = html;

    // Update keyword analysis
    updateKeywordAnalysis(keywords, parsedResume);
    
    // Show/hide download buttons based on upload format
    const wordBtn = document.getElementById('downloadWordBtn');
    const pdfBtn = document.getElementById('downloadPdfBtn');
    
    if (uploadedFiles.resumeFormat === 'docx') {
        wordBtn.style.display = 'inline-flex';
        wordBtn.classList.add('primary');
        pdfBtn.classList.remove('primary');
    } else {
        wordBtn.style.display = 'inline-flex'; // Always show Word option
        pdfBtn.classList.add('primary');
    }
}

function generateResumeHTML(resume, options) {
    const name = resume.personalInfo?.fullName || 'Your Name';
    const email = resume.personalInfo?.email || '';
    const phone = resume.personalInfo?.phone || '';
    const location = resume.personalInfo?.location || '';
    const linkedin = resume.personalInfo?.linkedin || '';
    const portfolio = resume.personalInfo?.portfolio || '';

    // Two-column professional format matching the reference
    let html = `
        <div class="resume-two-column">
            <!-- Header with teal bar -->
            <div class="resume-header">
                <h1 class="resume-name">${name}</h1>
            </div>
            
            <div class="resume-body">
                <!-- Left Column - Main Content -->
                <div class="resume-left-column">
    `;

    // Professional Summary
    const summary = resume.summary || generateSummary(resume, resumeData.jobTitle);
    html += `
                    <div class="resume-section">
                        <div class="section-header-bar">PROFESSIONAL SUMMARY</div>
                        <div class="section-content">
                            <p>${summary}</p>
                        </div>
                    </div>
    `;

    // Experience
    if (resume.experience && resume.experience.length > 0) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">EXPERIENCE</div>
                        <div class="section-content">
        `;
        resume.experience.forEach(exp => {
            const startDate = formatDate(exp.startDate) || exp.startDate || '';
            const endDate = exp.endDate === 'Present' ? 'Present' : (formatDate(exp.endDate) || exp.endDate || '');
            const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : (startDate || endDate || '');
            const expLocation = exp.location || '';
            
            html += `
                            <div class="experience-entry">
                                <div class="exp-title-line">
                                    <strong>${exp.title || 'Position'}</strong>${dateRange ? ` – ${dateRange}` : ''}
                                </div>
                                <div class="exp-company">${exp.company || ''}${expLocation ? ', ' + expLocation : ''}</div>
                                ${exp.description ? formatExperienceDescription(exp.description) : ''}
                            </div>
            `;
        });
        html += `
                        </div>
                    </div>
        `;
    }

    // Projects (in left column)
    if (resume.projects) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">PROJECTS</div>
                        <div class="section-content">
                            ${formatBulletPointsStyled(resume.projects)}
                        </div>
                    </div>
        `;
    }

    // Close left column, start right column
    html += `
                </div>
                
                <!-- Right Column - Sidebar -->
                <div class="resume-right-column">
    `;

    // Profile Photo (if uploaded)
    if (uploadedFiles.photoDataUrl) {
        html += `
                    <div class="resume-photo-container">
                        <img src="${uploadedFiles.photoDataUrl}" alt="Profile Photo" class="resume-photo">
                    </div>
        `;
    }

    // Contact Section
    html += `
                    <div class="resume-section">
                        <div class="section-header-bar">CONTACT</div>
                        <div class="section-content contact-section">
    `;
    if (location) {
        html += `<div class="contact-item"><strong>Address:</strong><br>${location}</div>`;
    }
    if (phone) {
        html += `<div class="contact-item"><strong>Phone:</strong><br>${phone}</div>`;
    }
    if (email) {
        html += `<div class="contact-item"><strong>Email:</strong><br>${email}</div>`;
    }
    if (linkedin) {
        html += `<div class="contact-item"><strong>LinkedIn:</strong><br><a href="${linkedin}" target="_blank">${linkedin.replace('https://', '').replace('http://', '')}</a></div>`;
    }
    if (portfolio) {
        html += `<div class="contact-item"><strong>Portfolio:</strong><br><a href="${portfolio}" target="_blank">${portfolio.replace('https://', '').replace('http://', '')}</a></div>`;
    }
    html += `
                        </div>
                    </div>
    `;

    // Core Qualifications / Skills
    if (resume.skills?.technical || resume.skills?.soft) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">CORE QUALIFICATIONS</div>
                        <div class="section-content">
                            <ul class="qualifications-list">
        `;
        const allSkills = `${resume.skills.technical || ''}, ${resume.skills.soft || ''}`
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        allSkills.forEach(skill => {
            html += `<li>${skill}</li>`;
        });
        html += `
                            </ul>
                        </div>
                    </div>
        `;
    }

    // Certifications
    if (resume.certifications) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">CERTIFICATIONS</div>
                        <div class="section-content">
                            ${formatBulletPointsStyled(resume.certifications)}
                        </div>
                    </div>
        `;
    }

    // Education
    if (resume.education && resume.education.length > 0) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">EDUCATION</div>
                        <div class="section-content">
        `;
        resume.education.forEach(edu => {
            const year = edu.year || '';
            const details = edu.details || edu.relevant || '';
            html += `
                            <div class="education-entry">
                                <strong>${edu.degree || 'Degree'}</strong>${year ? ` - ${year}` : ''}
                                <div class="edu-institution">${edu.institution || ''}</div>
                                ${edu.gpa ? `<div class="edu-gpa">GPA: ${edu.gpa}</div>` : ''}
                                ${details ? `<div class="edu-details">${details}</div>` : ''}
                            </div>
            `;
        });
        html += `
                        </div>
                    </div>
        `;
    }

    // Appreciations / Awards
    if (resume.additionalSections?.awards) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">APPRECIATIONS</div>
                        <div class="section-content">
                            ${formatBulletPointsStyled(resume.additionalSections.awards)}
                        </div>
                    </div>
        `;
    }

    // Languages
    if (resume.additionalSections?.languages) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">LANGUAGES</div>
                        <div class="section-content">
                            ${formatLanguagesSection(resume.additionalSections.languages)}
                        </div>
                    </div>
        `;
    }

    // Other additional sections
    if (resume.additionalSections?.volunteer) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">VOLUNTEER</div>
                        <div class="section-content">
                            ${formatBulletPointsStyled(resume.additionalSections.volunteer)}
                        </div>
                    </div>
        `;
    }

    if (resume.additionalSections?.publications) {
        html += `
                    <div class="resume-section">
                        <div class="section-header-bar">PUBLICATIONS</div>
                        <div class="section-content">
                            ${formatBulletPointsStyled(resume.additionalSections.publications)}
                        </div>
                    </div>
        `;
    }

    // Close right column and body
    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}

// Format experience description with sub-sections like "Roles and Responsibilities:"
function formatExperienceDescription(text) {
    if (!text) return '';
    
    let html = '';
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSubsection = null;
    let bullets = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        // Check if it's a subsection header (ends with : and doesn't start with bullet)
        if (trimmed.endsWith(':') && !trimmed.match(/^[•\-\*]/)) {
            // Output previous bullets if any
            if (bullets.length > 0) {
                html += '<ul class="exp-bullets">';
                bullets.forEach(b => { html += `<li>${b}</li>`; });
                html += '</ul>';
                bullets = [];
            }
            // Add subsection header
            html += `<div class="exp-subsection"><strong>${trimmed}</strong></div>`;
        } else {
            // It's a bullet point
            const cleanLine = trimmed.replace(/^[•\-\*]\s*/, '').trim();
            if (cleanLine) {
                bullets.push(highlightKeywords(cleanLine));
            }
        }
    });
    
    // Output remaining bullets
    if (bullets.length > 0) {
        html += '<ul class="exp-bullets">';
        bullets.forEach(b => { html += `<li>${b}</li>`; });
        html += '</ul>';
    }
    
    return html;
}

// Highlight important keywords in bold
function highlightKeywords(text) {
    // Bold text between ** markers if present
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return text;
}

// Format bullet points with proper styling
function formatBulletPointsStyled(text) {
    if (!text) return '';
    const lines = text.split('\n').filter(line => line.trim());
    let html = '<ul class="styled-bullets">';
    lines.forEach(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanLine) {
            html += `<li>${highlightKeywords(cleanLine)}</li>`;
        }
    });
    html += '</ul>';
    return html;
}

// Format languages as a table like in the reference
function formatLanguagesSection(text) {
    if (!text) return '';
    
    // Try to parse as structured language data
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check if it's simple list or has proficiency info
    const hasLevels = text.toLowerCase().includes('native') || 
                      text.toLowerCase().includes('fluent') || 
                      text.toLowerCase().includes('proficient') ||
                      text.toLowerCase().includes('yes') ||
                      text.toLowerCase().includes('read') ||
                      text.toLowerCase().includes('write');
    
    if (hasLevels && lines.length > 1) {
        // Create a table format
        let html = '<table class="languages-table"><thead><tr><th>Language</th><th>Read</th><th>Write</th><th>Speak</th></tr></thead><tbody>';
        lines.forEach(line => {
            const cleanLine = line.replace(/^[•\-\*\d\.]\s*/, '').trim();
            if (cleanLine) {
                // Try to parse: "English - Native" or "English: Read, Write, Speak"
                const parts = cleanLine.split(/[-:,]/);
                const lang = parts[0]?.trim() || cleanLine;
                const hasAll = cleanLine.toLowerCase().includes('native') || cleanLine.toLowerCase().includes('fluent');
                html += `<tr><td>${lang}</td><td>${hasAll ? 'Yes' : 'Yes'}</td><td>${hasAll ? 'Yes' : 'Yes'}</td><td>${hasAll ? 'Yes' : 'Yes'}</td></tr>`;
            }
        });
        html += '</tbody></table>';
        return html;
    } else {
        // Simple list
        return formatBulletPointsStyled(text);
    }
}

function generateSummary(resume, jobTitle) {
    const name = resume.personalInfo?.fullName || 'Professional';
    const title = jobTitle || 'experienced professional';
    
    return `Results-driven ${title} with a proven track record of delivering high-quality solutions. Skilled in leveraging technical expertise and collaborative approach to drive organizational success. Committed to continuous learning and applying best practices to achieve measurable outcomes.`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateLong(dateString) {
    if (!dateString) return '';
    // Handle formats like "2023-07" or "July 2023"
    if (dateString.match(/^\d{4}-\d{2}$/)) {
        const date = new Date(dateString + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return dateString; // Return as-is if already formatted
}

function formatBulletPoints(text) {
    const lines = text.split('\n').filter(line => line.trim());
    let html = '<ul>';
    lines.forEach(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanLine) {
            html += `<li>${cleanLine}</li>`;
        }
    });
    html += '</ul>';
    return html;
}

function formatRawText(text) {
    // Try to intelligently format raw resume text
    return text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<br>';
        if (trimmed.match(/^[•\-\*]/)) {
            return `<li>${trimmed.replace(/^[•\-\*]\s*/, '')}</li>`;
        }
        return `<p>${trimmed}</p>`;
    }).join('');
}

function updateKeywordAnalysis(keywords, resume) {
    const resumeText = JSON.stringify(resume).toLowerCase();
    
    let matched = 0;
    let total = 0;
    const keywordsList = document.getElementById('keywordsList');
    keywordsList.innerHTML = '';

    // Process keywords and check matches
    const processedKeywords = [];
    keywords.found.forEach(keyword => {
        if (!keyword || typeof keyword !== 'string') return;
        const cleanKeyword = keyword.toLowerCase().trim();
        if (cleanKeyword.length < 2) return;
        
        // Check if keyword exists in resume (with some flexibility)
        const isMatched = resumeText.includes(cleanKeyword) || 
                         resumeText.includes(cleanKeyword.replace(/-/g, ' ')) ||
                         resumeText.includes(cleanKeyword.replace(/ /g, '-'));
        
        if (isMatched) matched++;
        total++;
        
        processedKeywords.push({ keyword: keyword, matched: isMatched });
    });

    // Sort: matched first, then unmatched
    processedKeywords.sort((a, b) => b.matched - a.matched);
    
    // Display keywords
    processedKeywords.forEach(item => {
        const tag = document.createElement('span');
        tag.className = `keyword-tag ${item.matched ? 'matched' : 'missing'}`;
        tag.innerHTML = `${item.matched ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'} ${item.keyword}`;
        keywordsList.appendChild(tag);
    });

    const percentage = total > 0 ? Math.round((matched / total) * 100) : 0;

    document.getElementById('matchedKeywords').textContent = `${matched}/${total}`;
    document.getElementById('matchPercentage').textContent = `${percentage}%`;
    
    // Update match score color
    const matchElement = document.getElementById('matchPercentage');
    if (percentage >= 80) {
        matchElement.style.color = '#10b981'; // Green
    } else if (percentage >= 60) {
        matchElement.style.color = '#f59e0b'; // Yellow
    } else {
        matchElement.style.color = '#ef4444'; // Red
    }
}

// ===== Result Actions =====
function editResume() {
    const preview = document.getElementById('resumePreview');
    preview.contentEditable = preview.contentEditable === 'true' ? 'false' : 'true';
    
    if (preview.contentEditable === 'true') {
        preview.style.border = '2px dashed var(--primary-color)';
        showNotification('Edit mode enabled. Click anywhere to edit.', 'info');
    } else {
        preview.style.border = 'none';
        showNotification('Edit mode disabled.', 'info');
    }
}

function regenerateResume() {
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('resultSection').classList.remove('active');
    document.getElementById('step4').classList.add('active');
    currentStep = 4;
    
    showNotification('Adjust your options and regenerate.', 'info');
}

function copyToClipboard() {
    const preview = document.getElementById('resumePreview');
    const text = preview.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Resume copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy. Please try again.', 'error');
    });
}

function downloadResume(format) {
    const preview = document.getElementById('resumePreview');
    
    if (format === 'pdf') {
        // Open print dialog for PDF with ULTRA PROFESSIONAL production-grade styles
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Professional Resume</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    
                    * { 
                        margin: 0; 
                        padding: 0; 
                        box-sizing: border-box; 
                    }
                    
                    body { 
                        font-family: 'Source Sans Pro', 'Calibri', 'Segoe UI', Arial, sans-serif; 
                        font-size: 10.5pt; 
                        line-height: 1.5; 
                        color: #2d3748;
                        background: white;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    
                    .resume-two-column { 
                        max-width: 850px; 
                        margin: 0 auto; 
                        background: white;
                        box-shadow: 0 0 30px rgba(0,0,0,0.1);
                    }
                    
                    /* Premium Header Design */
                    .resume-header {
                        background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%) !important;
                        padding: 28px 35px;
                        position: relative;
                        overflow: hidden;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .resume-header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%);
                        pointer-events: none;
                    }
                    
                    .resume-header::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: linear-gradient(90deg, #e53e3e, #ed8936, #ecc94b);
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .resume-name {
                        color: white !important;
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 28pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 3px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        position: relative;
                        z-index: 1;
                    }
                    
                    .resume-body { 
                        display: flex; 
                        gap: 0;
                    }
                    
                    .resume-left-column { 
                        flex: 1.7; 
                        padding: 25px 30px;
                        background: white;
                    }
                    
                    .resume-right-column { 
                        flex: 1; 
                        min-width: 220px;
                        background: linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%);
                        padding: 25px 20px;
                        border-left: 1px solid #e2e8f0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Premium Section Headers */
                    .section-header-bar {
                        background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%) !important;
                        color: white !important;
                        font-size: 9pt;
                        font-weight: 700;
                        padding: 8px 14px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        margin-bottom: 15px;
                        border-radius: 2px;
                        position: relative;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .section-header-bar::after {
                        content: '';
                        position: absolute;
                        bottom: -3px;
                        left: 14px;
                        width: 40px;
                        height: 3px;
                        background: linear-gradient(90deg, #e53e3e, #ed8936);
                        border-radius: 2px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .section-content { 
                        padding: 0 5px; 
                    }
                    
                    .section-content p { 
                        margin: 0 0 12px 0; 
                        text-align: justify;
                        color: #4a5568;
                        font-size: 10pt;
                        line-height: 1.6;
                    }
                    
                    .resume-section { 
                        margin-bottom: 22px; 
                    }
                    
                    /* Premium Experience Styling */
                    .experience-entry { 
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    .experience-entry:last-child {
                        border-bottom: none;
                        padding-bottom: 0;
                    }
                    
                    .exp-title-line { 
                        font-size: 11pt; 
                        font-weight: 700;
                        color: #1e3a5f;
                        margin-bottom: 3px;
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        flex-wrap: wrap;
                    }
                    
                    .exp-title-line strong {
                        color: #1e3a5f;
                    }
                    
                    .exp-company { 
                        color: #718096; 
                        font-weight: 600;
                        font-size: 10pt;
                        margin-bottom: 10px;
                        font-style: normal;
                    }
                    
                    .exp-subsection { 
                        margin: 12px 0 6px 0;
                        font-weight: 700;
                        color: #2d3748;
                        font-size: 9.5pt;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .exp-bullets { 
                        margin: 8px 0 12px 0; 
                        padding-left: 18px;
                    }
                    
                    .exp-bullets li { 
                        margin-bottom: 6px; 
                        text-align: justify;
                        color: #4a5568;
                        font-size: 9.5pt;
                        line-height: 1.5;
                        position: relative;
                    }
                    
                    .exp-bullets li::marker {
                        color: #e53e3e;
                    }
                    
                    /* Right Column Styles */
                    .contact-section { 
                        font-size: 9.5pt; 
                    }
                    
                    .contact-item { 
                        margin-bottom: 12px;
                        padding: 8px 10px;
                        background: white;
                        border-radius: 4px;
                        border-left: 3px solid #e53e3e;
                    }
                    
                    .contact-item strong {
                        color: #1e3a5f;
                        font-size: 8pt;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: block;
                        margin-bottom: 3px;
                    }
                    
                    .contact-item a { 
                        color: #2c5282; 
                        text-decoration: none;
                        font-weight: 500;
                    }
                    
                    /* Skills & Qualifications */
                    .qualifications-list, .styled-bullets { 
                        padding-left: 16px; 
                        margin: 0;
                    }
                    
                    .qualifications-list li, .styled-bullets li { 
                        margin-bottom: 6px; 
                        font-size: 9.5pt;
                        color: #4a5568;
                        line-height: 1.4;
                    }
                    
                    .qualifications-list li::marker, .styled-bullets li::marker {
                        color: #e53e3e;
                    }
                    
                    /* Education */
                    .education-entry { 
                        margin-bottom: 14px; 
                        font-size: 9.5pt;
                        padding: 10px;
                        background: white;
                        border-radius: 4px;
                    }
                    
                    .education-entry strong {
                        color: #1e3a5f;
                        font-size: 10pt;
                    }
                    
                    .edu-institution { 
                        color: #718096;
                        font-weight: 500;
                        margin-top: 2px;
                    }
                    
                    .edu-gpa {
                        color: #e53e3e;
                        font-weight: 600;
                        font-size: 9pt;
                        margin-top: 3px;
                    }
                    
                    /* Photo */
                    .resume-photo-container { 
                        text-align: center; 
                        margin-bottom: 20px; 
                    }
                    
                    .resume-photo { 
                        width: 140px; 
                        height: 175px; 
                        border: 4px solid #1e3a5f; 
                        border-radius: 8px; 
                        object-fit: cover;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    }
                    
                    /* Languages Table */
                    .languages-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 9pt;
                        background: white;
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    
                    .languages-table th, .languages-table td { 
                        border: 1px solid #e2e8f0; 
                        padding: 6px 8px; 
                        text-align: center; 
                    }
                    
                    .languages-table th { 
                        background: #1e3a5f !important;
                        color: white !important;
                        font-weight: 600;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .languages-table td:first-child { 
                        text-align: left;
                        font-weight: 500;
                    }
                    
                    /* Print Optimization */
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important;
                        }
                        
                        .resume-two-column {
                            box-shadow: none;
                        }
                        
                        .resume-header, 
                        .resume-header::after,
                        .section-header-bar,
                        .section-header-bar::after,
                        .resume-right-column,
                        .languages-table th { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                        }
                    }
                </style>
            </head>
            <body>
                ${preview.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    } else if (format === 'docx') {
        // Generate Word document using docx library
        generateWordDocument();
    } else if (format === 'txt') {
        // Create a simple text download
        const text = preview.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        saveAs(blob, 'resume.txt');
        showNotification('Text file downloaded!', 'success');
    }
}

// ===== Generate Word Document =====
function generateWordDocument() {
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Tab, TabStopType, ShadingType, TableRow, TableCell, Table, WidthType, VerticalAlign } = docx;
    
    const resume = parsedResumeStructure || resumeData;
    const name = resume.personalInfo?.fullName || 'Your Name';
    const email = resume.personalInfo?.email || '';
    const phone = resume.personalInfo?.phone || '';
    const location = resume.personalInfo?.location || '';
    const linkedin = resume.personalInfo?.linkedin || '';
    const portfolio = resume.personalInfo?.portfolio || '';
    
    const children = [];
    
    // Name Header with teal background
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: name.toUpperCase(),
                    bold: true,
                    size: 48, // 24pt
                    color: "FFFFFF"
                })
            ],
            shading: {
                type: ShadingType.SOLID,
                color: "4a8e8e"
            },
            spacing: { after: 200 }
        })
    );
    
    // Contact Info Section
    children.push(createSectionHeader('CONTACT'));
    
    if (location) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Address: ', bold: true, size: 20 }),
                    new TextRun({ text: location, size: 20 })
                ],
                spacing: { after: 50 }
            })
        );
    }
    if (phone) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Phone: ', bold: true, size: 20 }),
                    new TextRun({ text: phone, size: 20 })
                ],
                spacing: { after: 50 }
            })
        );
    }
    if (email) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Email: ', bold: true, size: 20 }),
                    new TextRun({ text: email, size: 20 })
                ],
                spacing: { after: 50 }
            })
        );
    }
    if (linkedin) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'LinkedIn: ', bold: true, size: 20 }),
                    new TextRun({ text: linkedin, size: 20, color: "4a8e8e" })
                ],
                spacing: { after: 50 }
            })
        );
    }
    if (portfolio) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Portfolio: ', bold: true, size: 20 }),
                    new TextRun({ text: portfolio, size: 20, color: "4a8e8e" })
                ],
                spacing: { after: 50 }
            })
        );
    }
    
    // Professional Summary
    const summary = resume.summary || generateSummary(resume, resumeData.jobTitle);
    children.push(createSectionHeader('PROFESSIONAL SUMMARY'));
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: summary,
                    size: 22
                })
            ],
            spacing: { after: 200 }
        })
    );
    
    // Core Qualifications / Skills
    if (resume.skills?.technical || resume.skills?.soft) {
        children.push(createSectionHeader('CORE QUALIFICATIONS'));
        const allSkills = `${resume.skills.technical || ''}, ${resume.skills.soft || ''}`
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        
        allSkills.forEach(skill => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '• ' + skill,
                            size: 20
                        })
                    ],
                    spacing: { after: 30 }
                })
            );
        });
    }
    
    // Experience
    if (resume.experience && resume.experience.length > 0) {
        children.push(createSectionHeader('EXPERIENCE'));
        
        resume.experience.forEach(exp => {
            const startDate = formatDateLong(exp.startDate) || exp.startDate || '';
            const endDate = exp.endDate === 'Present' ? 'Present' : (formatDateLong(exp.endDate) || exp.endDate || '');
            const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : (startDate || endDate || '');
            const expLocation = exp.location || '';
            
            // Job title and date on same line
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${exp.title || 'Position'}${dateRange ? ' – ' + dateRange : ''}`,
                            bold: true,
                            size: 22
                        })
                    ],
                    spacing: { before: 150 }
                })
            );
            
            // Company and location
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${exp.company || 'Company'}${expLocation ? ', ' + expLocation : ''}`,
                            italics: true,
                            size: 22,
                            color: "475569"
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
            
            // Description bullets with support for subsection headers
            if (exp.description) {
                const bullets = exp.description.split('\n').filter(line => line.trim());
                bullets.forEach(bullet => {
                    const trimmed = bullet.trim();
                    // Check if it's a subsection header (ends with : and doesn't start with bullet)
                    if (trimmed.endsWith(':') && !trimmed.match(/^[•\-\*]/)) {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: trimmed,
                                        bold: true,
                                        size: 22
                                    })
                                ],
                                spacing: { before: 100, after: 50 }
                            })
                        );
                    } else {
                        const cleanBullet = trimmed.replace(/^[•\-\*]\s*/, '').trim();
                        if (cleanBullet) {
                            children.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: '• ' + cleanBullet,
                                            size: 22
                                        })
                                    ],
                                    indent: { left: 360 },
                                    spacing: { after: 50 }
                                })
                            );
                        }
                    }
                });
            }
        });
    }
    
    // Education
    if (resume.education && resume.education.length > 0) {
        children.push(createSectionHeader('EDUCATION'));
        
        resume.education.forEach(edu => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: edu.degree || 'Degree',
                            bold: true,
                            size: 24
                        }),
                        new TextRun({
                            text: '\t',
                        }),
                        new TextRun({
                            text: edu.year || '',
                            size: 20,
                            color: "64748b"
                        })
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
                    spacing: { before: 150 }
                })
            );
            
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: edu.institution || 'Institution',
                            italics: true,
                            size: 22,
                            color: "475569"
                        }),
                        edu.gpa ? new TextRun({
                            text: ` | GPA: ${edu.gpa}`,
                            size: 20,
                            color: "64748b"
                        }) : new TextRun({ text: '' })
                    ],
                    spacing: { after: 100 }
                })
            );
        });
    }
    
    // Certifications
    if (resume.certifications) {
        children.push(createSectionHeader('CERTIFICATIONS'));
        const certs = resume.certifications.split('\n').filter(line => line.trim());
        certs.forEach(cert => {
            const cleanCert = cert.replace(/^[•\-\*]\s*/, '').trim();
            if (cleanCert) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '• ' + cleanCert,
                                size: 22
                            })
                        ],
                        spacing: { after: 50 }
                    })
                );
            }
        });
    }
    
    // Projects
    if (resume.projects) {
        children.push(createSectionHeader('PROJECTS'));
        const projects = resume.projects.split('\n').filter(line => line.trim());
        projects.forEach(project => {
            const cleanProject = project.replace(/^[•\-\*]\s*/, '').trim();
            if (cleanProject) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '• ' + cleanProject,
                                size: 22
                            })
                        ],
                        spacing: { after: 50 }
                    })
                );
            }
        });
    }
    
    // Additional Sections (languages, volunteer, awards, publications, etc.)
    if (resume.additionalSections) {
        const sections = resume.additionalSections;
        
        const addSection = (title, content) => {
            if (content) {
                children.push(createSectionHeader(title.toUpperCase()));
                const items = content.split('\n').filter(line => line.trim());
                items.forEach(item => {
                    const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
                    if (cleanItem) {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: '• ' + cleanItem,
                                        size: 22
                                    })
                                ],
                                spacing: { after: 50 }
                            })
                        );
                    }
                });
            }
        };
        
        addSection('Languages', sections.languages);
        addSection('Volunteer Experience', sections.volunteer);
        addSection('Awards & Honors', sections.awards);
        addSection('Publications', sections.publications);
        addSection('Additional Information', sections.other);
    }
    
    // If we have raw text but no structured data, include it
    if (resume.rawText && (!resume.experience || resume.experience.length === 0)) {
        children.push(createSectionHeader('CONTENT'));
        const lines = resume.rawText.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line.trim(),
                                size: 22
                            })
                        ],
                        spacing: { after: 50 }
                    })
                );
            }
        });
    }
    
    // Create document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 720,    // 0.5 inch
                        right: 720,
                        bottom: 720,
                        left: 720
                    }
                }
            },
            children: children
        }]
    });
    
    // Generate and download
    docx.Packer.toBlob(doc).then(blob => {
        const fileName = uploadedFiles.resume ? 
            uploadedFiles.resume.name.replace(/\.[^/.]+$/, '') + '_updated.docx' : 
            'tailored_resume.docx';
        saveAs(blob, fileName);
        showNotification(`Word document "${fileName}" downloaded successfully!`, 'success');
    }).catch(error => {
        console.error('Error generating Word document:', error);
        showNotification('Error generating Word document. Please try PDF instead.', 'error');
    });
}

function createSectionHeader(text) {
    const { Paragraph, TextRun, BorderStyle, ShadingType } = docx;
    
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 20,
                color: "FFFFFF"
            })
        ],
        shading: {
            type: ShadingType.SOLID,
            color: "4a8e8e"
        },
        spacing: { before: 200, after: 100 }
    });
}

function startOver() {
    // Reset all data
    resumeData = {
        jobTitle: '',
        companyName: '',
        jobDescription: '',
        resumeText: '',
        personalInfo: {},
        experience: [],
        education: [],
        skills: {},
        certifications: '',
        projects: '',
        supportingDocs: {}
    };
    uploadedFiles = { 
        resume: null, 
        resumeFormat: null,
        resumeContent: '',
        supporting: [],
        photo: null,
        photoDataUrl: null
    };
    parsedResumeStructure = null;

    // Reset form fields
    document.querySelectorAll('input, textarea').forEach(el => {
        if (el.type !== 'checkbox') {
            el.value = '';
        } else {
            // Keep AI-related checkboxes checked by default
            const keepChecked = ['optimizeATS', 'includeKeywords', 'quantifyAchievements', 'useAI', 'rewriteBullets'];
            el.checked = keepChecked.includes(el.id);
        }
    });

    // Reset UI
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('resultSection').classList.remove('active');
    document.getElementById('uploadedResumeInfo').style.display = 'none';
    document.getElementById('supportingFilesList').innerHTML = '';
    
    // Reset photo
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>No photo</span>
        `;
    }
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    if (removePhotoBtn) {
        removePhotoBtn.style.display = 'none';
    }
    
    // Reset download buttons
    document.getElementById('downloadWordBtn').style.display = 'none';
    document.getElementById('downloadPdfBtn').classList.add('primary');

    // Reset progress
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.querySelector('.progress-step[data-step="1"]').classList.add('active');

    // Reset steps
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    currentStep = 1;

    // Reset tabs
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index === 0);
    });
    document.querySelectorAll('.tab-content').forEach((content, index) => {
        content.classList.toggle('active', index === 0);
    });

    showNotification('Starting fresh!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
        color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#1e40af'};
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== AI Configuration Functions =====
function loadAIConfig() {
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('openai_model');
    
    if (savedKey) {
        aiConfig.apiKey = savedKey;
        document.getElementById('openaiApiKey').value = savedKey;
        updateAIStatus(true);
    }
    
    if (savedModel) {
        aiConfig.model = savedModel;
        document.getElementById('aiModel').value = savedModel;
    }
    
    updateAINotice();
}

function toggleAISettings() {
    const panel = document.getElementById('aiSettingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('openaiApiKey');
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

async function saveAndTestApiKey() {
    const apiKey = document.getElementById('openaiApiKey').value.trim();
    const model = document.getElementById('aiModel').value;
    const resultDiv = document.getElementById('apiTestResult');
    
    if (!apiKey) {
        resultDiv.className = 'api-test-result error';
        resultDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter an API key';
        return;
    }
    
    if (!apiKey.startsWith('sk-')) {
        resultDiv.className = 'api-test-result error';
        resultDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid API key format. Key should start with "sk-"';
        return;
    }
    
    resultDiv.className = 'api-test-result';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
    
    try {
        // Test the API key with a simple request
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Say "Connected" in one word.' }],
                max_tokens: 10
            })
        });
        
        if (response.ok) {
            // Save to localStorage
            localStorage.setItem('openai_api_key', apiKey);
            localStorage.setItem('openai_model', model);
            
            aiConfig.apiKey = apiKey;
            aiConfig.model = model;
            aiConfig.isConnected = true;
            
            resultDiv.className = 'api-test-result success';
            resultDiv.innerHTML = '<i class="fas fa-check-circle"></i> Successfully connected to OpenAI! AI features are now enabled.';
            
            updateAIStatus(true);
            updateAINotice();
            showNotification('AI connected successfully!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || 'Connection failed');
        }
    } catch (error) {
        resultDiv.className = 'api-test-result error';
        resultDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        updateAIStatus(false);
    }
}

function clearApiKey() {
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('openai_model');
    
    aiConfig.apiKey = '';
    aiConfig.isConnected = false;
    
    document.getElementById('openaiApiKey').value = '';
    document.getElementById('apiTestResult').style.display = 'none';
    
    updateAIStatus(false);
    updateAINotice();
    showNotification('API key cleared', 'info');
}

function updateAIStatus(connected) {
    const statusDiv = document.getElementById('aiStatus');
    aiConfig.isConnected = connected;
    
    if (connected) {
        statusDiv.className = 'ai-status connected';
        statusDiv.innerHTML = '<i class="fas fa-circle"></i><span>AI: Connected</span>';
    } else {
        statusDiv.className = 'ai-status disconnected';
        statusDiv.innerHTML = '<i class="fas fa-circle"></i><span>AI: Not Connected</span>';
    }
}

function updateAINotice() {
    const notice = document.getElementById('aiNotice');
    const noticeText = document.getElementById('aiNoticeText');
    
    if (aiConfig.isConnected) {
        notice.className = 'ai-notice connected';
        noticeText.innerHTML = '<i class="fas fa-check-circle"></i> AI is ready! Your resume will be intelligently optimized.';
    } else {
        notice.className = 'ai-notice';
        noticeText.innerHTML = 'Configure your OpenAI API key above to enable AI features. Without AI, basic keyword matching will be used.';
    }
}

// ===== AI-Powered Resume Generation =====
async function generateResumeWithAI(resumeContent, jobDescription, options) {
    const { tone, optimizeATS, includeKeywords, quantifyAchievements, rewriteBullets } = options;
    
    // First, analyze the job description thoroughly
    const jobAnalysis = await analyzeJobDescription(jobDescription);
    
    // Then generate the optimized resume
    const optimizedResume = await generateOptimizedResume(resumeContent, jobDescription, jobAnalysis, options);
    
    return optimizedResume;
}

async function analyzeJobDescription(jobDescription) {
    const analysisPrompt = `Analyze this job description in detail and extract the following information in JSON format:

JOB DESCRIPTION:
${jobDescription}

Extract and return this JSON structure:
{
    "jobTitle": "exact job title",
    "company": "company name if mentioned",
    "requiredSkills": ["list of required technical skills"],
    "preferredSkills": ["list of preferred/nice-to-have skills"],
    "softSkills": ["required soft skills like leadership, communication"],
    "experienceLevel": "entry/mid/senior/executive",
    "yearsExperience": "number or range mentioned",
    "keyResponsibilities": ["main job responsibilities"],
    "mustHaveKeywords": ["critical keywords that MUST appear in resume"],
    "industryTerms": ["industry-specific terminology used"],
    "toolsAndTechnologies": ["specific tools, software, platforms mentioned"],
    "educationRequirements": ["degree requirements"],
    "certificationsMentioned": ["any certifications mentioned"],
    "companyValues": ["company culture/values if mentioned"],
    "actionVerbs": ["action verbs used in the description"],
    "quantifiableExpectations": ["any metrics or KPIs mentioned"]
}

Return ONLY valid JSON.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: aiConfig.model,
                messages: [
                    { role: 'system', content: 'You are an expert job description analyzer. Extract all relevant information accurately.' },
                    { role: 'user', content: analysisPrompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) throw new Error('Job analysis failed');
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('Job analysis error:', error);
        return null;
    }
}

async function generateOptimizedResume(resumeContent, jobDescription, jobAnalysis, options) {
    const { tone, optimizeATS, includeKeywords, quantifyAchievements, rewriteBullets } = options;
    
    const analysisContext = jobAnalysis ? `
DETAILED JOB ANALYSIS:
- Required Skills: ${jobAnalysis.requiredSkills?.join(', ') || 'N/A'}
- Preferred Skills: ${jobAnalysis.preferredSkills?.join(', ') || 'N/A'}
- Soft Skills Needed: ${jobAnalysis.softSkills?.join(', ') || 'N/A'}
- Key Responsibilities: ${jobAnalysis.keyResponsibilities?.join('; ') || 'N/A'}
- Must-Have Keywords (INCLUDE THESE): ${jobAnalysis.mustHaveKeywords?.join(', ') || 'N/A'}
- Tools/Technologies: ${jobAnalysis.toolsAndTechnologies?.join(', ') || 'N/A'}
- Experience Level: ${jobAnalysis.experienceLevel || 'N/A'}
- Industry Terms to Use: ${jobAnalysis.industryTerms?.join(', ') || 'N/A'}
- Action Verbs from JD: ${jobAnalysis.actionVerbs?.join(', ') || 'N/A'}
` : '';

    const systemPrompt = `You are an expert resume optimizer. Your job is to ENHANCE an existing resume for a specific job, NOT rewrite it from scratch.

CRITICAL RULE #1: PRESERVE ALL ORIGINAL CONTENT
- Keep EVERY job position, company, date, education entry, project, and certification from the original
- Do NOT remove, skip, or omit ANY experience or information
- Do NOT shorten the resume by removing content
- Include ALL bullet points from the original, just improve their wording

CRITICAL RULE #2: ENHANCE, DON'T REPLACE
- Improve wording of existing bullet points to include relevant keywords
- Add metrics/numbers where the original lacks them (estimate reasonably)
- Reorder bullet points to put most relevant ones first
- You may ADD new bullet points if they help, but NEVER delete original ones

CRITICAL RULE #3: MAINTAIN STRUCTURE
- Keep the same sections the candidate has
- Keep all jobs in the same order (most recent first)
- Keep all education entries
- Keep all projects and certifications

YOUR TASK: Take the candidate's COMPLETE resume and optimize the WORDING to better match the job description while keeping ALL their content intact.`;

    const userPrompt = `
=== TARGET JOB DESCRIPTION ===
${jobDescription}

${analysisContext}

=== CANDIDATE'S COMPLETE RESUME (PRESERVE ALL OF THIS) ===
${resumeContent}

=== OPTIMIZATION INSTRUCTIONS ===
1. KEEP every single job, education, project, and certification from above
2. ENHANCE bullet points by adding keywords from job description naturally
3. IMPROVE action verbs to be stronger and match job description language
4. ADD metrics/numbers where missing (use reasonable estimates like "Managed team of X", "Improved efficiency by X%")
5. REORDER bullets within each job to prioritize most relevant to target job
6. CREATE a tailored professional summary that highlights relevant experience for THIS job
7. ENSURE skills section includes all skills from original PLUS relevant ones from job description that candidate likely has

=== OUTPUT FORMAT ===
Return a JSON object with the COMPLETE optimized resume. Include EVERY position, education, etc. from the original.

{
    "personalInfo": {
        "fullName": "EXACT name from resume",
        "email": "EXACT email from resume",
        "phone": "EXACT phone from resume",
        "location": "EXACT location from resume",
        "linkedin": "EXACT linkedin from resume if present",
        "portfolio": "EXACT portfolio/website from resume if present"
    },
    "summary": "NEW tailored 3-4 sentence summary highlighting experience relevant to this specific job. Mention years of experience, key achievements, and skills that match the job requirements.",
    "skills": {
        "technical": "ALL original technical skills + relevant skills from job description the candidate likely has",
        "soft": "ALL original soft skills + relevant ones from job description"
    },
    "experience": [
        {
            "title": "EXACT job title from resume",
            "company": "EXACT company name from resume",
            "location": "EXACT location if in resume",
            "startDate": "EXACT start date from resume",
            "endDate": "EXACT end date from resume (or Present)",
            "description": "• ENHANCED bullet 1 - same content but improved wording with keywords\\n• ENHANCED bullet 2 - add metrics if missing\\n• ENHANCED bullet 3\\n• Include ALL original bullets, enhanced\\n• You may add 1-2 new relevant bullets if helpful"
        }
        // INCLUDE EVERY JOB FROM THE ORIGINAL RESUME - DO NOT SKIP ANY
    ],
    "education": [
        {
            "degree": "EXACT degree from resume",
            "institution": "EXACT school from resume",
            "year": "EXACT year from resume",
            "gpa": "EXACT GPA if in resume",
            "details": "Any honors, relevant coursework, activities from original"
        }
        // INCLUDE ALL EDUCATION ENTRIES
    ],
    "certifications": "ALL certifications from original resume, formatted as bullet points",
    "projects": "ALL projects from original resume with enhanced descriptions highlighting relevant skills",
    "additionalSections": {
        "languages": "If in original resume",
        "volunteer": "If in original resume",
        "awards": "If in original resume",
        "publications": "If in original resume",
        "other": "Any other sections from original resume"
    }
}

REMEMBER: 
- Include EVERY job position from the original (even if 5+ jobs)
- Include EVERY bullet point (enhanced, not removed)
- Include ALL education, certifications, projects
- The output should be LONGER or SAME length as original, never shorter
- If unsure about something, KEEP the original content

Return ONLY valid JSON.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: aiConfig.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 8000  // Increased for longer resumes
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Resume generation failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse the JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            // Store the job analysis for keyword matching display
            result._jobAnalysis = jobAnalysis;
            return result;
        } else {
            throw new Error('Invalid AI response format');
        }
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
}

// ===== Cover Letter Functionality =====
function toggleCoverLetter() {
    const section = document.getElementById('coverLetterSection');
    if (section.style.display === 'none' || !section.style.display) {
        generateCoverLetter();
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

function closeCoverLetter() {
    document.getElementById('coverLetterSection').style.display = 'none';
}

function generateCoverLetter() {
    const preview = document.getElementById('coverLetterPreview');
    
    // Get personal info from saved data
    const fullName = document.getElementById('fullName')?.value || resumeData.personalInfo?.fullName || 'Harshitha Bidarahalli Padmanabha';
    const email = document.getElementById('email')?.value || resumeData.personalInfo?.email || 'harshithabp798@gmail.com';
    const phone = document.getElementById('phone')?.value || resumeData.personalInfo?.phone || '+44 7771090667';
    const location = document.getElementById('location')?.value || resumeData.personalInfo?.location || 'London Road, Newbury Business Park, Newbury, RG14 2FX';
    const jobTitle = resumeData.jobTitle || 'Science Teacher';
    const companyName = resumeData.companyName || 'The Downs School & Sixth Form';
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const coverLetterHTML = `
        <div class="cover-letter-content">
            <div class="cover-letter-section-header">
                <p><strong>${fullName}</strong></p>
                <p>Email: ${email}</p>
                <p>Phone: ${phone}</p>
                <p>${location}</p>
            </div>
            
            <div class="cover-letter-date">
                <p>Date: ${dateStr}</p>
            </div>
            
            <div class="cover-letter-recipient">
                <p><strong>Hiring Manager</strong></p>
                <p>${companyName}</p>
            </div>
            
            <div class="cover-letter-greeting">
                <p>Dear Hiring Manager,</p>
            </div>
            
            <div class="cover-letter-body">
                <div class="cover-letter-paragraph">
                    <p><strong>Re: ${jobTitle} Position</strong></p>
                    <p>I am writing to apply for the ${jobTitle} position at ${companyName}. I am currently completing my Initial Teacher Training in Physics, with placements at Kennet School and The Downs School, and I am keen to begin my teaching career in a school that has played a significant role in shaping my development. Your vision of educating today's students for the world of tomorrow strongly aligns with my commitment to fostering curiosity, resilience, and a love of learning in all students.</p>
                </div>
                
                <div class="cover-letter-paragraph">
                    <p>Throughout my training, I have planned and delivered engaging Physics lessons aligned with the National Curriculum, including practical work, modelling, and retrieval-based activities. I have adapted materials to support a wide range of abilities and implemented positive behaviour management strategies to create a calm, purposeful learning environment. These experiences have strengthened my confidence in teaching Physics and have prepared me to contribute effectively to the Science Faculty.</p>
                </div>
                
                <div class="cover-letter-paragraph">
                    <p>Before beginning my training in the UK, I completed a Bachelor of Education (B.Ed) in India and gained valuable classroom teaching experience. This provided a strong foundation in pedagogy, assessment, and student-centred learning, which has supported my transition into the UK curriculum. My previous career as a Software Engineer has further developed my analytical thinking, problem-solving skills, and confidence with technology—strengths that enhance my teaching practice. Additionally, my role at Tesco strengthened my communication, teamwork, and interpersonal skills, all of which contribute to building positive relationships with students, colleagues, and parents.</p>
                </div>
                
                <div class="cover-letter-paragraph">
                    <p>${companyName}'s excellent reputation, caring ethos, and commitment to staff well-being make it an ideal environment to begin my Early Career Teacher journey. I would welcome the opportunity to contribute to the continued success of the Science Department and to support students in achieving their full potential.</p>
                </div>
                
                <div class="cover-letter-paragraph">
                    <p>Thank you for considering my application. I would be delighted to discuss how my skills and enthusiasm can support the students and wider school community at ${companyName}.</p>
                </div>
            </div>
            
            <div class="cover-letter-closing">
                <p>Yours sincerely,</p>
                <p style="margin-top: 40px;"><strong>${fullName}</strong></p>
                <p class="applied-notice"><i class="fas fa-info-circle"></i> You have already applied for this job</p>
            </div>
        </div>
    `;
    
    preview.innerHTML = coverLetterHTML;
}

function editCoverLetter() {
    const preview = document.getElementById('coverLetterPreview');
    const content = preview.innerHTML;
    
    // Simple edit mode - allow inline editing
    const editableDiv = preview.querySelector('.cover-letter-content');
    editableDiv.contentEditable = 'true';
    editableDiv.classList.add('editable');
    
    showNotification('Cover letter is now editable. Click outside to save.', 'info');
    
    // Save on blur
    editableDiv.addEventListener('blur', function() {
        editableDiv.contentEditable = 'false';
        editableDiv.classList.remove('editable');
    }, { once: true });
}

function copyCoverLetterToClipboard() {
    const preview = document.getElementById('coverLetterPreview');
    const text = preview.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Cover letter copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

function downloadCoverLetter(format) {
    const preview = document.getElementById('coverLetterPreview');
    const fullName = document.getElementById('fullName')?.value || 'Harshitha_Bidarahalli_Padmanabha';
    const filename = `Cover_Letter_${fullName.replace(/\s+/g, '_')}`;
    
    if (format === 'pdf') {
        // Open print dialog for PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    
                    * { 
                        margin: 0; 
                        padding: 0; 
                        box-sizing: border-box; 
                    }
                    
                    body { 
                        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; 
                        font-size: 11pt; 
                        line-height: 1.6; 
                        color: #333;
                        background: white;
                    }
                    
                    .cover-letter-content {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    
                    .cover-letter-section-header {
                        margin-bottom: 20px;
                        line-height: 1.4;
                    }
                    
                    .cover-letter-date {
                        margin-bottom: 20px;
                    }
                    
                    .cover-letter-recipient {
                        margin-bottom: 20px;
                        line-height: 1.5;
                    }
                    
                    .cover-letter-greeting {
                        margin: 30px 0 20px 0;
                    }
                    
                    .cover-letter-body {
                        margin: 20px 0;
                    }
                    
                    .cover-letter-paragraph {
                        margin-bottom: 15px;
                        text-align: justify;
                        line-height: 1.6;
                    }
                    
                    .cover-letter-paragraph p {
                        margin: 0 0 10px 0;
                    }
                    
                    .cover-letter-closing {
                        margin-top: 30px;
                        line-height: 1.6;
                    }
                    
                    .applied-notice {
                        margin-top: 40px !important;
                        font-size: 10pt;
                        color: #666;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                ${preview.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
    } else if (format === 'docx') {
        // Create a Word document
        const text = preview.innerText;
        
        const docContent = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>
        ${text.split('\n').map((line) => {
            if (line.trim()) {
                return `<w:p><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`;
            }
            return '<w:p></w:p>';
        }).join('')}
    </w:body>
</w:document>
        `;
        
        // Use FileSaver to download
        const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        saveAs(blob, `${filename}.docx`);
    }
}

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
