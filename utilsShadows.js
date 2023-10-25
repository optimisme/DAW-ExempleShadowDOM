const fs = require('fs').promises
const path = require('path');
const glob = require('glob');

class Obj {

    // Inicia la connexió amb la base de dades
    async init (indexPath, shadowsPath) {
        this.indexDev = await this.processIndexDev(indexPath, shadowsPath)
        this.shadows = await this.processShadows(shadowsPath)
    }

    getIndexDev () { return this.indexDev }
    getShadows () { return this.shadows }

    async processIndexDev(indexPath, shadowsPath) {
        try {
            // Busca archivos JavaScript en subcarpetas de shadowsPath
            const jsFiles = await new Promise((resolve, reject) => {
                glob('**/*.js', { cwd: shadowsPath }, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files);
                    }
                });
            });
    
            const scripts = jsFiles.map(jsFile => `<script src="/shadows/${jsFile}" defer></script>`).join('\n        ');
            let indexTXT = await fs.readFile(indexPath, 'utf8');
            
            // Reemplaza la etiqueta de script existente con los nuevos scripts
            indexTXT = indexTXT.replace('<script src="/shadows.js" defer></script>', scripts);
    
            return indexTXT;
        } catch (error) {
            console.error("Error 'processIndexDev':", error);
            return "<html><body>Error</body></html>";
        }
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
                accumulatedContent += '\n\n' + fixed;
            } else if (stats.isDirectory()) {
                // Recursivitat per processar subdirectoris
                accumulatedContent += '\n\n' + await this.processShadows(shadowsPath)
            }
            }
        } catch (error) {
            console.error("Error 'processShadows':", error)
        }
        return accumulatedContent
    }
}

// Export
module.exports = Obj