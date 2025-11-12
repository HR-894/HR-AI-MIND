# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - img [ref=e7]
    - generic [ref=e9]:
      - heading "Something went wrong" [level=1] [ref=e10]
      - paragraph [ref=e11]: The application encountered an unexpected error. Please reload the page to continue.
    - group [ref=e12]:
      - generic "Error details" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - button "Reload Application" [ref=e15] [cursor=pointer]
      - button "Reset App State" [ref=e16] [cursor=pointer]
    - paragraph [ref=e17]: After reset, you can reload the page.
  - region "Notifications (F8)":
    - list
```