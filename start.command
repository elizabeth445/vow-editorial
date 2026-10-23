#!/bin/zsh
# Local launcher also supports the Node runtime bundled with Codex.
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  if [[ -f "$HOME/.codex/bin/frontend-env.sh" ]]; then
    source "$HOME/.codex/bin/frontend-env.sh"
  fi
fi
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  print 'Сначала установите зависимости: pnpm install --frozen-lockfile (при установленном Node.js).'
  exit 1
fi
print 'Откройте адрес, который появится ниже. Для остановки нажмите Ctrl+C.'
exec node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
