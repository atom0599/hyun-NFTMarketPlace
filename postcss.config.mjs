/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // [변경됨] v4에서는 이 플러그인을 써야 합니다.
    autoprefixer: {},
  },
};

export default config;