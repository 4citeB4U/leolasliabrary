# Contributing to Moma's Book

Thank you for your interest in contributing to Moma's Book! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- **Search existing issues** before creating new ones
- **Use the bug report template** when available
- **Provide detailed steps** to reproduce the issue
- **Include browser/device information**
- **Add console errors** if applicable

### 💡 Feature Requests
- **Check existing feature requests** first
- **Describe the problem** you're trying to solve
- **Explain your proposed solution**
- **Consider implementation complexity**
- **Provide mockups or examples** when helpful

### 📝 Documentation
- **Fix typos and grammar**
- **Improve clarity and examples**
- **Add missing documentation**
- **Update outdated information**

### 🔧 Code Contributions
- **Follow coding standards**
- **Write tests when applicable**
- **Update documentation**
- **Keep changes focused and atomic**

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of HTML, CSS, and JavaScript
- Text editor or IDE
- Git for version control

### Development Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork locally
git clone https://github.com/yourusername/momasbook.git
cd momasbook

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes
# 5. Test thoroughly using the validation tools

# 6. Commit your changes
git add .
git commit -m "Add your descriptive commit message"

# 7. Push to your fork
git push origin feature/your-feature-name

# 8. Create a Pull Request on GitHub
```

## 📋 Development Guidelines

### Code Style
- **Use consistent indentation** (2 spaces for HTML/CSS, 4 spaces for JavaScript)
- **Follow semantic HTML** practices
- **Use meaningful variable names**
- **Comment complex logic**
- **Keep functions small and focused**

### JavaScript Standards
```javascript
// Use const/let instead of var
const bookTitle = 'Needle & Yarn';
let currentPage = 0;

// Use arrow functions for callbacks
pageFlip.on('flip', (e) => {
    console.log('Page flipped to:', e.data);
});

// Use template literals for strings
const message = `Reading page ${currentPage + 1} of ${totalPages}`;

// Handle errors gracefully
try {
    pageFlip.flipNext();
} catch (error) {
    console.error('Failed to flip page:', error);
}
```

### CSS Guidelines
```css
/* Use CSS custom properties for theming */
:root {
    --primary-color: #34648C;
    --secondary-color: #8FB9D8;
}

/* Use BEM methodology for class names */
.book-container {}
.book-container__page {}
.book-container__page--active {}

/* Mobile-first responsive design */
.book-container {
    width: 100%;
}

@media (min-width: 768px) {
    .book-container {
        width: 80%;
    }
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] **Auto-reading works** from any page
- [ ] **Page navigation** works with clicks and keyboard
- [ ] **Voice commands** respond correctly
- [ ] **Stop functionality** works reliably
- [ ] **Mobile responsiveness** on different screen sizes
- [ ] **Cross-browser compatibility**

### Automated Testing
```javascript
// Run validation suite in browser console
validateBookFixes();

// Check performance metrics
agentlyDebug.getPerformance();

// Validate current state
agentlyDebug.getState();
```

### Browser Testing
Test your changes in:
- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (if available)
- **Edge** (latest)
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
feat(narrator): add word-by-word highlighting
fix(navigation): resolve page skipping issue
docs(readme): update installation instructions
style(css): improve button hover effects
```

## 🔍 Pull Request Process

### Before Submitting
1. **Test thoroughly** on multiple browsers
2. **Run validation suite** (`validateBookFixes()`)
3. **Update documentation** if needed
4. **Check for console errors**
5. **Ensure responsive design** works

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] Validation suite passes

## Screenshots
(If applicable)

## Additional Notes
Any additional context or considerations
```

### Review Process
1. **Automated checks** run on PR creation
2. **Manual review** by maintainers
3. **Testing** on different browsers/devices
4. **Feedback** and requested changes
5. **Approval** and merge

## 🐛 Issue Templates

### Bug Report
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 91]
- Device: [e.g. iPhone 12]
- OS: [e.g. iOS 14]

**Additional context**
Any other context about the problem.
```

### Feature Request
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 📚 Resources

### Documentation
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [PageFlip.js Documentation](https://github.com/Nodlik/StPageFlip)
- [HTML5 Audio/Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)

### Tools
- [Browser DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Can I Use](https://caniuse.com/) - Browser compatibility

### Community
- [GitHub Discussions](https://github.com/yourusername/momasbook/discussions)
- [Issues](https://github.com/yourusername/momasbook/issues)

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## 📞 Questions?

If you have questions about contributing:
- **Check existing documentation** first
- **Search closed issues** for similar questions
- **Open a discussion** for general questions
- **Contact maintainers** for specific concerns

Thank you for contributing to Moma's Book! 🎉
