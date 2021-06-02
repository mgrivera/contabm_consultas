
module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:meteor/recommended",
        "plugin:react/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module", 
        "ecmaFeatures": {
            "jsx": true
        },
    },
    "plugins": [
        "react", 
        "react-hooks", 
        "import"
    ],
    "rules": {
        "prefer-const": ["error", {
            "destructuring": "any",
            "ignoreReadBeforeAssign": false
        }],
        // suppress errors for missing 'import React' in files 
        // this error was showing even in html files (???)
        "react/react-in-jsx-scope": "off", 

        "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks

        // dejams de usar este rule, pues obliga a agregar en el dependency array en el useReffm, 
        // prácticamente, cualquier variable que está adentro. Esto, nos parece, hace que interpretar 
        // el código que corresponde al hook sea más difícil 
        // "react-hooks/exhaustive-deps": "warn" // Checks effect dependencies
    }
}