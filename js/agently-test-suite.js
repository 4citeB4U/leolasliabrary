// Agently Narration Test Suite
// Run comprehensive tests on the enhanced narration system

class AgentlyTestSuite {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }
    
    // Main test runner
    async runAllTests() {
        console.log('🧪 Starting Agently Narration Test Suite...');
        
        const tests = [
            { name: 'Page Validation', fn: this.testPageValidation },
            { name: 'Content Extraction', fn: this.testContentExtraction },
            { name: 'Dynamic Content Adjustment', fn: this.testContentAdjustment },
            { name: 'Error Handling', fn: this.testErrorHandling },
            { name: 'State Management', fn: this.testStateManagement },
            { name: 'Anti-Redundancy', fn: this.testAntiRedundancy },
            { name: 'Voice System', fn: this.testVoiceSystem },
            { name: 'Performance', fn: this.testPerformance }
        ];
        
        for (const test of tests) {
            await this.runTest(test.name, test.fn.bind(this));
        }
        
        this.generateReport();
        return this.testResults;
    }
    
    async runTest(name, testFn) {
        const startTime = Date.now();
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name,
                status: 'PASS',
                result,
                duration,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ ${name}: PASS (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name,
                status: 'FAIL',
                error: error.message,
                duration,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ ${name}: FAIL - ${error.message} (${duration}ms)`);
        }
    }
    
    // Test page validation workflow
    testPageValidation() {
        if (!window.AgentlyNarration) {
            throw new Error('AgentlyNarration not initialized');
        }
        
        const pages = document.querySelectorAll('.page');
        if (pages.length === 0) {
            throw new Error('No pages found');
        }
        
        let validPages = 0;
        let invalidPages = 0;
        
        for (let i = 0; i < pages.length; i++) {
            if (window.AgentlyNarration.validatePage(i)) {
                validPages++;
            } else {
                invalidPages++;
            }
        }
        
        return `${validPages} valid, ${invalidPages} invalid out of ${pages.length} total pages`;
    }
    
    // Test content extraction
    testContentExtraction() {
        const testPage = document.querySelector('.page');
        if (!testPage) {
            throw new Error('No test page available');
        }
        
        const content = window.AgentlyNarration.extractPageContent(testPage);
        
        if (!content || content.trim().length === 0) {
            throw new Error('Content extraction returned empty result');
        }
        
        return `Extracted ${content.length} characters`;
    }
    
    // Test dynamic content adjustment
    testContentAdjustment() {
        const shortContent = "Short text.";
        const longContent = "This is a very long piece of content that should be summarized. ".repeat(20);
        
        const adjustedShort = window.AgentlyNarration.adjustContentDensity(shortContent);
        const adjustedLong = window.AgentlyNarration.adjustContentDensity(longContent);
        
        if (adjustedShort.length <= shortContent.length) {
            throw new Error('Short content was not enhanced');
        }
        
        if (adjustedLong.length >= longContent.length) {
            throw new Error('Long content was not summarized');
        }
        
        return `Short: ${shortContent.length} → ${adjustedShort.length}, Long: ${longContent.length} → ${adjustedLong.length}`;
    }
    
    // Test error handling system
    testErrorHandling() {
        const initialErrorCount = window.AgentlyNarration.state.error_log.length;
        
        // Generate test errors
        window.AgentlyNarration.logError('E404', 'Test missing page error');
        window.AgentlyNarration.logError('E303', 'Test empty content error');
        
        const finalErrorCount = window.AgentlyNarration.state.error_log.length;
        
        if (finalErrorCount <= initialErrorCount) {
            throw new Error('Error logging not working');
        }
        
        return `Logged ${finalErrorCount - initialErrorCount} test errors`;
    }
    
    // Test state management
    testStateManagement() {
        const originalState = { ...window.AgentlyNarration.state };
        
        // Modify state
        window.AgentlyNarration.state.current_page = 999;
        window.AgentlyNarration.state.test_value = 'test';
        
        // Save and reload
        window.AgentlyNarration.saveSessionState();
        window.AgentlyNarration.loadSessionState();
        
        // Verify persistence
        const savedState = JSON.parse(localStorage.getItem('agently-session'));
        
        if (!savedState || savedState.test_value !== 'test') {
            throw new Error('State persistence failed');
        }
        
        // Restore original state
        window.AgentlyNarration.state = originalState;
        window.AgentlyNarration.saveSessionState();
        
        return 'State save/load working correctly';
    }
    
    // Test anti-redundancy system
    testAntiRedundancy() {
        const testContent = "This is test content for redundancy checking.";
        
        // Clear cache
        window.AgentlyNarration.state.anti_redundancy_cache.clear();
        
        // Add content to cache
        window.AgentlyNarration.state.anti_redundancy_cache.add(testContent);
        
        // Check if content is detected as duplicate
        const isDuplicate = window.AgentlyNarration.state.anti_redundancy_cache.has(testContent);
        
        if (!isDuplicate) {
            throw new Error('Anti-redundancy cache not working');
        }
        
        return `Cache contains ${window.AgentlyNarration.state.anti_redundancy_cache.size} entries`;
    }
    
    // Test voice system
    testVoiceSystem() {
        const voices = speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            throw new Error('No voices available');
        }
        
        const femaleVoice = window.femaleVoice;
        const hasPreferredVoice = femaleVoice !== null;
        
        return `${voices.length} voices available, preferred voice: ${hasPreferredVoice ? femaleVoice.name : 'none'}`;
    }
    
    // Test performance metrics
    testPerformance() {
        const performance = window.AgentlyNarration.performance;
        const report = performance.getReport();
        
        if (typeof report.sessionDuration !== 'number') {
            throw new Error('Performance tracking not working');
        }
        
        return `Session: ${report.sessionDuration}ms, Pages: ${report.pagesRead}, Errors: ${report.errorsLogged}`;
    }
    
    // Generate comprehensive test report
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = Date.now() - this.startTime;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: Math.round((passedTests / totalTests) * 100),
                duration: totalDuration
            },
            details: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n📊 Test Report Summary:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${report.summary.successRate}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(t => t.status === 'FAIL')
                .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
        }
        
        // Store report for external access
        window.agentlyTestReport = report;
        
        return report;
    }
}

// Auto-run tests if in development mode
if (window.location.hostname === 'localhost' || window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.AgentlyNarration) {
                const testSuite = new AgentlyTestSuite();
                testSuite.runAllTests();
            }
        }, 2000);
    });
}

// Expose test suite globally
window.AgentlyTestSuite = AgentlyTestSuite;
