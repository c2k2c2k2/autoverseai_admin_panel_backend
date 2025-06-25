export class SlugUtil {
    static generateSlug(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    static generateUniqueSlug(text: string, existingSlugs: string[]): string {
        let baseSlug = this.generateSlug(text);
        let slug = baseSlug;
        let counter = 1;

        while (existingSlugs.includes(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }
}