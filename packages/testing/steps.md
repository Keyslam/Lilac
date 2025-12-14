Here is the sequence that avoids analysis paralysis:

1. Add the event system inside your test runner.

Just define onTestStart, onTestEnd, etc. That's the foundation.

2. Add 1 reporter: ConsoleReporter

Make sure it works with full suite.

3. Add subset running ability

Even if it's crude, e.g. run only tests matching a prefix.
<modulePath>::<suiteName>::<testName>
specs.math.add::MathSuite::adds two numbers

4. Add SocketReporter

Super thin wrapper: connect to host/port, send JSON lines.

5. Add tiny Node “bridge script”

This listens for socket messages and prints them (for now).
No VS Code integration yet.

6. Later: wrap bridge script into VS Code test adapter

But only after everything above works.

7. Later: GitHub actions → call CLI version → read JSON output

This requires zero extra effort once events exist.
