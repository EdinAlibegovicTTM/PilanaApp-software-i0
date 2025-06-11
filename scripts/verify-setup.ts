import * as fs from "fs"

interface SetupCheck {
  name: string
  check: () => boolean
  fix?: () => void
  required: boolean
}

const checks: SetupCheck[] = [
  {
    name: ".env.local exists",
    check: () => fs.existsSync(".env.local"),
    required: true,
  },
  {
    name: "JWT_SECRET is set",
    check: () => {
      if (!fs.existsSync(".env.local")) return false
      const env = fs.readFileSync(".env.local", "utf8")
      return env.includes("JWT_SECRET=") && !env.includes("JWT_SECRET=your-value-here")
    },
    required: true,
  },
  {
    name: "node_modules exists",
    check: () => fs.existsSync("node_modules"),
    fix: () => console.log("Run: npm install"),
    required: true,
  },
  {
    name: "TypeScript compiles",
    check: () => {
      try {
        require("child_process").execSync("npx tsc --noEmit", { stdio: "ignore" })
        return true
      } catch {
        return false
      }
    },
    required: false,
  },
]

function runSetupVerification() {
  console.log("🔍 VERIFIKACIJA SETUP-A")
  console.log("======================")

  let allRequired = true
  let score = 0

  checks.forEach((check) => {
    const passed = check.check()
    const status = passed ? "✅" : check.required ? "❌" : "⚠️"

    console.log(`${status} ${check.name}`)

    if (passed) {
      score++
    } else if (check.required) {
      allRequired = false
      if (check.fix) {
        console.log(`   💡 Fix: ${check.fix}`)
      }
    }
  })

  console.log("")
  console.log(`📊 Score: ${score}/${checks.length}`)

  if (allRequired) {
    console.log("🎉 Setup je kompletan! Možete pokrenuti aplikaciju.")
    console.log("🚀 Pokrenite: npm run dev")
  } else {
    console.log("⚠️ Setup nije kompletan. Popravite greške iznad.")
  }

  return allRequired
}

// Pokreni verifikaciju
runSetupVerification()
