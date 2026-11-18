[{
	"resource": "/c:/Users/LENOVO/gths-results/app/dashboard/class-council/page.tsx",
	"owner": "eslint",
	"code": {
		"value": "react-hooks/set-state-in-effect",
		"target": {
			"$mid": 1,
			"path": "/reference/eslint-plugin-react-hooks/lints/set-state-in-effect",
			"scheme": "https",
			"authority": "react.dev"
		}
	},
	"severity": 8,
	"message": "Error: Calling setState synchronously within an effect can trigger cascading renders\n\nEffects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).\n\nC:\\Users\\LENOVO\\gths-results\\app\\dashboard\\class-council\\page.tsx:461:7\n  459 |   useEffect(() => {\n  460 |     if (activeStudents.length === 0) {\n> 461 |       setSelectedStudent(\"\");\n      |       ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect\n  462 |       return;\n  463 |     }\n  464 |",
	"source": "eslint",
	"startLineNumber": 461,
	"startColumn": 7,
	"endLineNumber": 461,
	"endColumn": 25,
	"origin": "extHost1"
},{
	"resource": "/c:/Users/LENOVO/gths-results/app/dashboard/class-council/page.tsx",
	"owner": "eslint",
	"code": {
		"value": "@typescript-eslint/no-unused-vars",
		"target": {
			"$mid": 1,
			"path": "/rules/no-unused-vars",
			"scheme": "https",
			"authority": "typescript-eslint.io"
		}
	},
	"severity": 4,
	"message": "'query' is defined but never used.",
	"source": "eslint",
	"startLineNumber": 11,
	"startColumn": 3,
	"endLineNumber": 11,
	"endColumn": 8,
	"tags": [
		1
	],
	"origin": "extHost1"
},{
	"resource": "/c:/Users/LENOVO/gths-results/app/dashboard/class-council/page.tsx",
	"owner": "eslint",
	"code": {
		"value": "@typescript-eslint/no-unused-vars",
		"target": {
			"$mid": 1,
			"path": "/rules/no-unused-vars",
			"scheme": "https",
			"authority": "typescript-eslint.io"
		}
	},
	"severity": 4,
	"message": "'where' is defined but never used.",
	"source": "eslint",
	"startLineNumber": 12,
	"startColumn": 3,
	"endLineNumber": 12,
	"endColumn": 8,
	"tags": [
		1
	],
	"origin": "extHost1"
}]