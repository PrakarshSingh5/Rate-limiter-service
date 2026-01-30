// Tab Functionality
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      // Remove active class from all tabs and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Copy to clipboard functionality
  const copyButtons = document.querySelectorAll('[data-copy]');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy');

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#10B981'; // Success color

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        btn.textContent = 'Failed';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 2000);
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Navbar scroll effect
  let lastScroll = 0;
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    } else {
      navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  // Animate elements on scroll
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

  // Observe feature cards, algorithm cards, etc.
  const animatedElements = document.querySelectorAll(
    '.feature-card, .algorithm-card, .pattern-card, .comparison-card, .install-step'
  );

  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Add hover effect to code blocks
  const codeBlocks = document.querySelectorAll('.code-block');
  codeBlocks.forEach(block => {
    block.addEventListener('mouseenter', () => {
      block.style.transform = 'scale(1.01)';
      block.style.transition = 'transform 0.2s ease';
    });

    block.addEventListener('mouseleave', () => {
      block.style.transform = 'scale(1)';
    });
  });

  // Stats counter animation
  const stats = document.querySelectorAll('.stat-number');
  let hasAnimated = false;

  const animateStats = () => {
    if (hasAnimated) return;

    const statsSection = document.querySelector('.hero-stats');
    const rect = statsSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

    if (isVisible) {
      hasAnimated = true;
      stats.forEach(stat => {
        const text = stat.textContent;
        if (text.includes('s')) {
          // Animate "30s"
          let count = 0;
          const interval = setInterval(() => {
            count += 1;
            stat.textContent = count + 's';
            if (count >= 30) clearInterval(interval);
          }, 20);
        }
      });
    }
  };

  window.addEventListener('scroll', animateStats);
  animateStats(); // Check on load

  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-github');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add CSS for ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Console easter egg
  console.log('%c@prakarsh/rate-limiter', 'font-size: 24px; font-weight: bold; color: #0066FF;');
  console.log('%cThanks for checking out the package! 🚀', 'font-size: 14px; color: #6B7280;');
  console.log('%cnpm install @prakarsh/rate-limiter', 'font-size: 12px; font-family: monospace; background: #111827; color: #00FF88; padding: 8px; border-radius: 4px;');
});
