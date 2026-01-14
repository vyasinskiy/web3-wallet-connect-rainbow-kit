import { defineConfig } from '@wagmi/cli'
import { hardhat, react } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated/wagmi.ts',
  plugins: [
    hardhat({
      project: '.', // путь к hardhat проекту
    }),
    react(), // опционально: сгенерит типобезопасные React-хуки
  ],
})
