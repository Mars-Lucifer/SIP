export function Footer() {
  return (
    <footer className="w-full px-4 pb-20 pt-0 sm:px-6 xl:px-[60px]">
      <div className="mx-auto max-w-[1320px]">
        <div className="h-0.5 w-full bg-q-surface" />

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div className="flex flex-col gap-5">
            <p className="text-2xl font-medium leading-[1.08] text-q-dark">
              Наши сети
            </p>
            <div className="flex items-center gap-3.5">
              <a
                href="https://t.me/sip_market"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
                aria-label="Telegram"
              >
                <img
                  src="/assets/icons/telegram.svg"
                  alt="telegram"
                  className="h-9 w-9"
                />
              </a>
              <a
                href="https://vk.com/sip_market"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
                aria-label="VK"
              >
                <img
                  src="/assets/icons/vk.svg"
                  alt="vk"
                  className="h-9 w-9"
                />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-2xl font-medium leading-[1.08] text-q-dark">
              Контакты
            </p>
            <div className="flex flex-col gap-5">
              <a
                href="tel:88005553535"
                className="text-base font-medium text-q-muted no-underline transition-colors duration-150 hover:text-q-dark"
              >
                8 800 555-35-35
              </a>
              <a
                href="mailto:help@sip.ru"
                className="text-base font-medium text-q-muted no-underline transition-colors duration-150 hover:text-q-dark"
              >
                help@sip.ru
              </a>
              <a
                href="https://t.me/sipru"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 no-underline transition-opacity duration-150 hover:opacity-75"
              >
                <img
                  src="/assets/icons/telegram.svg"
                  alt="telegram"
                  className="h-[1.125rem] w-[1.125rem]"
                />
                <span className="text-base font-medium text-q-muted">
                  @sipru
                </span>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-2xl font-medium leading-[1.08] text-q-dark">
              Документы
            </p>
            <div className="flex flex-col gap-5">
              {[
                "Пользовательское соглашение",
                "Политика конфиденциальности",
                "Публичная оферта",
                "Политика использования Cookie",
              ].map((doc) => (
                <a
                  key={doc}
                  href="#"
                  className="text-base font-medium text-q-muted no-underline transition-colors duration-150 hover:text-q-dark"
                >
                  {doc}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-2xl font-medium leading-[1.08] text-q-dark">
              Данные
            </p>
            <div className="flex flex-col gap-5">
              <p className="text-base font-medium text-q-muted">ИНН: 123456789</p>
              <p className="text-base font-medium text-q-muted">ООО &quot;SIP&quot;</p>
              <p className="text-base font-medium text-q-muted">
                Город Тоски, улица грусти, переулок отчаяния, дом 13
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
