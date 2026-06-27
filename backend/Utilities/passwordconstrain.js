function passwordValidator(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 8) return false;
    if (password.includes(' ')) return false;

    const chars = password.split('');
    const hasLowercase = chars.some(char => char >= 'a' && char <= 'z');
    const hasUppercase = chars.some(char => char >= 'A' && char <= 'Z');
    const hasDigit     = chars.some(char => char >= '0' && char <= '9');
    const hasSpecial   = chars.some(char => {
        const isLetterOrNum = (char >= 'a' && char <= 'z') || 
                              (char >= 'A' && char <= 'Z') || 
                              (char >= '0' && char <= '9');
        return !isLetterOrNum;
    });

    // Returns true ONLY if every single rule is met
    return hasLowercase && hasUppercase && hasDigit && hasSpecial;
}
module.exports=passwordValidator;