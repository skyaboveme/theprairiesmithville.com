// Modern JavaScript for The Prairie Smithville Website
// Matching the functionality and interactions of prairie-rblr77.manus.space

document.addEventListener('DOMContentLoaded', function() {
    // Hero Image Rotation
    const heroImages = document.querySelectorAll('.hero-image');
    const heroIndicators = document.querySelectorAll('.hero-indicator');
    let currentImageIndex = 0;
    let imageRotationInterval;

    function showImage(index) {
        // Hide all images
        heroImages.forEach((img, i) => {
            if (i === index) {
                img.style.opacity = '1';
                img.style.zIndex = '10';
            } else {
                img.style.opacity = '0';
                img.style.zIndex = '5';
            }
        });

        // Update indicators
        heroIndicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.remove('bg-white/40');
                indicator.classList.add('bg-white/70');
            } else {
                indicator.classList.remove('bg-white/70');
                indicator.classList.add('bg-white/40');
            }
        });

        currentImageIndex = index;
    }

    function nextImage() {
        const nextIndex = (currentImageIndex + 1) % heroImages.length;
        showImage(nextIndex);
    }

    function startImageRotation() {
        imageRotationInterval = setInterval(nextImage, 4000); // Change image every 4 seconds
    }

    function stopImageRotation() {
        if (imageRotationInterval) {
            clearInterval(imageRotationInterval);
        }
    }

    // Initialize hero image rotation
    if (heroImages.length > 1) {
        // Set up indicator click handlers
        heroIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                stopImageRotation();
                showImage(index);
                startImageRotation(); // Restart rotation after manual selection
            });
        });

        // Pause rotation on hover
        const heroContainer = document.querySelector('.hero-image-container');
        if (heroContainer) {
            heroContainer.addEventListener('mouseenter', stopImageRotation);
            heroContainer.addEventListener('mouseleave', startImageRotation);
        }

        // Start automatic rotation
        startImageRotation();
    }

    // Mobile Navigation Toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Toggle aria-expanded for accessibility
            const isExpanded = !mobileMenu.classList.contains('hidden');
            mobileMenuButton.setAttribute('aria-expanded', isExpanded);
            
            // Update button icon
            const icon = mobileMenuButton.querySelector('svg');
            if (icon) {
                if (isExpanded) {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
                } else {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
                }
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                
                // Reset button icon
                const icon = mobileMenuButton.querySelector('svg');
                if (icon) {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                
                // Reset button icon
                const icon = mobileMenuButton.querySelector('svg');
                if (icon) {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
                }
            }
        });
    }
    
    // Smooth Scrolling for Navigation Links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar Background Change on Scroll
    const navbar = document.querySelector('nav');
    let lastScrollY = window.scrollY;
    
    function updateNavbar() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(12px)';
            navbar.style.borderBottomColor = 'rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(4px)';
            navbar.style.borderBottomColor = 'rgba(0, 0, 0, 0.05)';
        }
        
        lastScrollY = currentScrollY;
    }
    
    window.addEventListener('scroll', updateNavbar);
    updateNavbar(); // Initial call
    
    // Contact Form Handling
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message')
            };
            
            // Simple validation
            if (!data.firstName || !data.lastName || !data.email) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!isValidEmail(data.email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                showNotification('Thank you for your interest! We\'ll contact you soon.', 'success');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
    }
    
    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${message}</p>
                </div>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-weight: 500;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.bg-card, .text-center, .grid > div');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('#home');
    if (heroSection) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinksDesktop = document.querySelectorAll('nav a[href^="#"]');
    
    function updateActiveNavLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinksDesktop.forEach(link => {
            link.classList.remove('text-primary');
            link.classList.add('text-muted-foreground');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.remove('text-muted-foreground');
                link.classList.add('text-primary');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Initial call
    
    // Home card hover effects
    const homeCards = document.querySelectorAll('.bg-card');
    homeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Smooth reveal animations for sections
    function revealOnScroll() {
        const reveals = document.querySelectorAll('section');
        reveals.forEach(reveal => {
            const windowHeight = window.innerHeight;
            const elementTop = reveal.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('animate-fade-in');
            }
        });
    }
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial call
    
    // Form field focus effects
    const formInputs = document.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Console welcome message
    console.log(`
🏡 Welcome to The Prairie Smithville! 🏡
Where Families Flourish in Beautiful New Homes

Built with modern web technologies and designed for the best user experience.
For more information, visit our website or contact our sales team.

📍 Smithville, Texas
📞 (512) 555-0123
✉️ info@theprairiesmithville.com
    `);
    
    // Performance monitoring
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`🏡 The Prairie Smithville website loaded in ${loadTime}ms`);
        }
    });
    
    // Accessibility improvements
    // Add keyboard navigation for mobile menu
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }
    
    // Add focus management for mobile menu
    const firstMobileLink = mobileMenu?.querySelector('a');
    if (firstMobileLink) {
        mobileMenuButton.addEventListener('click', function() {
            if (!mobileMenu.classList.contains('hidden')) {
                setTimeout(() => {
                    firstMobileLink.focus();
                }, 100);
            }
        });
    }
    
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#home';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add focus trap for mobile menu
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.focus();
            }
        });
    }
    
    if (mobileMenu) {
        trapFocus(mobileMenu);
    }
});