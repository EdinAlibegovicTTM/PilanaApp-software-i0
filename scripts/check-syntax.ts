import * as ts from "typescript"
import * as fs from "fs"

function checkSyntaxErrors(filePath: string): void {
  const sourceCode = fs.readFileSync(filePath, "utf8")

  // Create TypeScript source file
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  // Check for syntax errors
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([filePath], {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    }),
  )

  if (diagnostics.length > 0) {
    console.log("🚨 Syntax errors found:")
    diagnostics.forEach((diagnostic) => {
      if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        console.log(`Line ${line + 1}, Column ${character + 1}: ${message}`)
      }
    })
  } else {
    console.log("✅ No syntax errors found!")
  }
}

// Check the form designer file
checkSyntaxErrors("./components/form-designer.tsx")
