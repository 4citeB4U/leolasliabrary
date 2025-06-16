// Book Fix Validator
// Validates that the auto-reading fixes are working correctly

class BookFixValidator {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }
    
    async validateBookFixes() {
        console.log('🔧 Validating book auto-reading fixes...');
        
        const tests = [
            { name: 'Page Flip Integration', fn: this.testPageFlipIntegration },
            { name: 'Auto Reading Function', fn: this.testAutoReadingFunction },
            { name: 'Stop Reading Function', fn: this.testStopReadingFunction },
            { name: 'Page Content Extraction', fn: this.testPageContentExtraction },
            { name: 'Sequential Page Reading', fn: this.testSequentialReading },
            { name: 'Back Cover Presence', fn: this.testBackCoverPresence },
            { name: 'Error Handling', fn: this.testErrorHandling }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.fn.bind(this));
        }
        
        this.generateReport();
        return this.results;
    }
    
    async runTest(name, testFn) {
        const startTime = Date.now();
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'PASS',
                result,
                duration,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ ${name}: PASS (${duration}ms) - ${result}`);
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.push({
                name,
                status: 'FAIL',
                error: error.message,
                duration,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ ${name}: FAIL - ${error.message} (${duration}ms)`);
        }
    }
    
    testPageFlipIntegration() {
        if (!window.pageFlip) {
            throw new Error('PageFlip instance not found');
        }
        
        const totalPages = window.pageFlip.getPageCount();
        const currentPage = window.pageFlip.getCurrentPageIndex();
        
        if (totalPages === 0) {
            throw new Error('No pages found in PageFlip');
        }
        
        return `PageFlip working: ${totalPages} pages, currently on page ${currentPage + 1}`;
    }
    
    testAutoReadingFunction() {
        if (!window.readEntireBook || typeof window.readEntireBook !== 'function') {
            throw new Error('readEntireBook function not found');
        }
        
        // Check if the function has the enhanced features
        const functionString = window.readEntireBook.toString();
        const hasEnhancements = functionString.includes('isAutoReading') && 
                               functionString.includes('currentPageIndex') &&
                               !functionString.includes('Chapter " + (currentPageIndex)');
        
        if (!hasEnhancements) {
            throw new Error('readEntireBook function lacks proper enhancements');
        }
        
        return 'readEntireBook function properly enhanced';
    }
    
    testStopReadingFunction() {
        const stopFunctions = [
            'stopAutoReading',
            'stopSpeaking',
            'isAutoReading'
        ];
        
        const missing = stopFunctions.filter(fn => !window[fn]);
        
        if (missing.length > 0) {
            throw new Error(`Missing stop functions: ${missing.join(', ')}`);
        }
        
        return 'All stop reading functions available';
    }
    
    testPageContentExtraction() {
        const pages = document.querySelectorAll('.page');
        if (pages.length === 0) {
            throw new Error('No pages found in document');
        }
        
        let pagesWithContent = 0;
        let totalContent = 0;
        
        for (let i = 0; i < Math.min(5, pages.length); i++) {
            const page = pages[i];
            const storyPage = page.querySelector('.story-page, .cover-page, .instruction-page, .dedication-page');
            
            if (storyPage) {
                const content = storyPage.textContent.trim();
                if (content.length > 0) {
                    pagesWithContent++;
                    totalContent += content.length;
                }
            }
        }
        
        if (pagesWithContent === 0) {
            throw new Error('No content found in any pages');
        }
        
        return `${pagesWithContent} pages with content, avg ${Math.round(totalContent / pagesWithContent)} chars`;
    }
    
    testSequentialReading() {
        const pages = document.querySelectorAll('.page');
        const pageContents = [];
        
        // Extract content from first few pages
        for (let i = 0; i < Math.min(3, pages.length); i++) {
            const page = pages[i];
            const contentDiv = page.querySelector('.story-page, .cover-page, .instruction-page, .dedication-page');
            
            if (contentDiv) {
                const heading = contentDiv.querySelector('h2, h3');
                const paragraphs = contentDiv.querySelectorAll('p');
                
                let content = '';
                if (heading) content += heading.textContent + '. ';
                paragraphs.forEach(p => content += p.textContent + ' ');
                
                pageContents.push(content.trim());
            }
        }
        
        // Check for artificial chapter numbering
        const hasArtificialChapters = pageContents.some(content => 
            content.includes('Chapter 0:') || 
            content.includes('Section 0:')
        );
        
        if (hasArtificialChapters) {
            throw new Error('Artificial chapter numbering detected');
        }
        
        return `Sequential reading validated for ${pageContents.length} pages`;
    }
    
    testBackCoverPresence() {
        const pages = document.querySelectorAll('.page');
        const lastPage = pages[pages.length - 1];
        
        if (!lastPage) {
            throw new Error('No pages found');
        }
        
        // Check if last page has back cover characteristics
        const hasBackCover = lastPage.querySelector('img[alt*="Back Cover"]') ||
                            lastPage.querySelector('img[alt*="back cover"]') ||
                            lastPage.textContent.includes('Thank you for reading') ||
                            lastPage.textContent.includes('The End');
        
        if (!hasBackCover) {
            throw new Error('Back cover not found or not properly marked');
        }
        
        return 'Back cover properly present';
    }
    
    testErrorHandling() {
        // Test that error handling functions exist
        if (!window.AgentlyNarration || !window.AgentlyNarration.logError) {
            throw new Error('Enhanced error handling not available');
        }
        
        // Test error logging
        const initialErrorCount = window.AgentlyNarration.state.error_log.length;
        window.AgentlyNarration.logError('TEST', 'Validation test error');
        const finalErrorCount = window.AgentlyNarration.state.error_log.length;
        
        if (finalErrorCount <= initialErrorCount) {
            throw new Error('Error logging not working');
        }
        
        return 'Error handling system functional';
    }
    
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(t => t.status === 'PASS').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n📊 Book Fix Validation Report:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.results
                .filter(t => t.status === 'FAIL')
                .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
        } else {
            console.log('\n🎉 All book fixes validated successfully!');
        }
        
        // Store report for external access
        window.bookFixReport = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: Math.round((passedTests / totalTests) * 100),
                duration: totalDuration
            },
            details: this.results,
            timestamp: new Date().toISOString()
        };
        
        return window.bookFixReport;
    }
}

// Auto-run validation if in development mode or test parameter
if (window.location.hostname === 'localhost' || window.location.search.includes('validate=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const validator = new BookFixValidator();
            validator.validateBookFixes();
        }, 3000); // Wait for all scripts to load
    });
}

// Expose validator globally
window.BookFixValidator = BookFixValidator;

// Console command for manual validation
window.validateBookFixes = function() {
    const validator = new BookFixValidator();
    return validator.validateBookFixes();
};
