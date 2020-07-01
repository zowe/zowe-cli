- https://docs.opis.io/json-schema/1.x/default-value.html
- https://docs.microsoft.com/en-us/windows/terminal/dynamic-profiles#:~:text=Dynamic%20profiles%20in%20Windows%20Terminal&text=This%20makes%20it%20easier%20for,to%20locate%20the%20proper%20executable.
- YAML Red Hat, Supports JSON Schema 7 and below.
- api ml push dynamic profiles
- allow `$schema` in every profile
- `zowe profiles edit zosmf`
- use the schema store to pull them automatically
- ship in zowe explorer?
```
{
  "contributes": {
    "yamlValidation": [
      {
        "fileMatch": "yourfile.yml",
        "url": "./schema.json"
      }
    ]
  }
}
```

- scs works?

Ways of introducting schema - perhaps Zowe Explorer?
Local json schema matching
- https://code.visualstudio.com/docs/languages/json