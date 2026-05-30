export function Footer() {
  return (
    <footer className="w-full px-4 sm:px-6 xl:px-[60px] pb-16 sm:pb-20">
      <div className="max-w-[1320px] mx-auto">
        <div className="h-0.5 bg-q-surface w-full mb-8 sm:mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Social */}
          <div className="flex flex-col gap-5">
            <p className="text-q-dark text-2xl font-medium leading-[1.08]">
              Соц сети
            </p>
            <div className="flex items-center gap-3.5">
              <a
                href="https://t.me/qship"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
                aria-label="Telegram"
              >
                <img
                  src="/assets/icons/telegram.svg"
                  alt="telegram"
                  className="h-[2.5rem] w-[2.5rem]"
                />
              </a>
              <a
                href="https://vk.com/qship"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
                aria-label="VK"
              >
                <img
                  src="/assets/icons/vk.svg"
                  alt="vk"
                  className="h-[2.5rem] w-[2.5rem]"
                />
              </a>
            </div>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-5">
            <p className="text-q-dark text-2xl font-medium leading-[1.08]">
              Контакты
            </p>
            <div className="flex flex-col gap-5">
              <a
                href="tel:88005553535"
                className="text-q-muted text-base font-medium no-underline hover:text-q-dark transition-colors duration-150"
              >
                8 800 555-35-35
              </a>
              <a
                href="mailto:help@qship.ru"
                className="text-q-muted text-base font-medium no-underline hover:text-q-dark transition-colors duration-150"
              >
                help@qship.ru
              </a>
              <a
                href="https://t.me/qship"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 no-underline hover:opacity-75 transition-opacity duration-150"
              >
                <img
                  src="/assets/icons/telegram.svg"
                  alt="telegram"
                  className="h-[1.125rem] w-[1.125rem]"
                />
                <span className="text-q-muted text-base font-medium">
                  @qship
                </span>
              </a>
            </div>
          </div>

          {/* Documents */}
          <div className="flex flex-col gap-5">
            <p className="text-q-dark text-2xl font-medium leading-[1.08]">
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
                  className="text-q-muted text-base font-medium no-underline hover:text-q-dark transition-colors duration-150"
                >
                  {doc}
                </a>
              ))}
            </div>
          </div>

          {/* Company data */}
          <div className="flex flex-col gap-5">
            <p className="text-q-dark text-2xl font-medium leading-[1.08]">
              Данные
            </p>
            <div className="flex flex-col gap-5">
              <p className="text-q-muted text-base font-medium">
                ИНН: 123456789
              </p>
              <p className="text-q-muted text-base font-medium">
                ООО "TechMarket"
              </p>
              <p className="text-q-muted text-base font-medium">
                Город Тоски, улица грусти, переулок отчаяния, дом 13
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
