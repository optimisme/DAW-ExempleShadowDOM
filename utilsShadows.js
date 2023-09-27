const fs = require('fs').promises
const path = require('path');

class Obj {

    // Inicia la connexió amb la base de dades
    async init (shadowsPath) {
        this.shadows = await this.processShadows(shadowsPath)
    }

    getShadows () {
        return this.shadows
    }

    async processShadows (shadowsPath) {
        // Crea un arxiu 'shadows.js' amb tots els codis dels shadows
        // inclosos els fitxers .css i .html corresponents
        let accumulatedContent = ""
        try {
            const files = await fs.readdir(shadowsPath)
            for (const file of files) {
            const fullPath = path.join(shadowsPath, file);
            const stats = await fs.stat(fullPath);
            if (stats.isFile() && path.extname(file) === '.js') {
                let fileTXT = await fs.readFile(fullPath, 'utf8')
                let fixed = fileTXT;
        
                // Substituir el contingut del .css
                const cssFilenameMatch = fixed.match(/await fetch\('\/shadows\/(.*\.css)'\)/)
                if (cssFilenameMatch) {
                    const cssFilename = cssFilenameMatch[1]
                    const cssContent = await fs.readFile(path.join(shadowsPath, cssFilename), 'utf8')
                    fixed = fixed.replace(cssFilenameMatch[0], `\`\n${cssContent}\n\``).replace(".then(r => r.text())", "")
                }
            
                // Substituir el contingut del .html
                const htmlFilenameMatch = fixed.match(/await fetch\('\/shadows\/(.*\.html)'\)/)
                if (htmlFilenameMatch) {
                    const htmlFilename = htmlFilenameMatch[1];
                    const htmlContent = await fs.readFile(path.join(shadowsPath, htmlFilename), 'utf8')
                    fixed = fixed.replace(htmlFilenameMatch[0], `\`\n${htmlContent}\n\``).replace(".then(r => r.text())", "").replaceAll("`", "\`")
                }
                accumulatedContent += '\n' + fixed;
            } else if (stats.isDirectory()) {
                // Recursivitat per processar subdirectoris
                accumulatedContent += '\n' + await this.processShadows(shadowsPath)
            }
            }
        } catch (error) {
            console.error("Hi ha hagut un error:", error)
        }
        return accumulatedContent
    }
}

// Export
module.exports = Obj
