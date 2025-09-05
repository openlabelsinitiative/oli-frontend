'use client';

import { useEffect } from 'react';

const FaqScript: React.FC = () => {
  useEffect(() => {
    // Initialize FAQ functionality
    const setupFaq = () => {
      const faqItems = document.querySelectorAll('.custom-faq-item');
      
      faqItems.forEach(item => {
        const button = item.querySelector('.custom-faq-question');
        
        if (button) {
          button.addEventListener('click', () => {
            item.classList.toggle('active');
          });
        }
      });
    };

    // Run setup after content is loaded
    setupFaq();

    // Setup observer to handle dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          setupFaq();
        }
      });
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export default FaqScript;
