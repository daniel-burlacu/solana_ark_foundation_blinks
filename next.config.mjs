/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/actions.json', // The requested path
                destination: '/api/actions', // Redirect to the correct API route
                permanent: true, // Indicates a permanent redirect (useful for SEO caching)
            },
        ];
    },
};

export default nextConfig;
