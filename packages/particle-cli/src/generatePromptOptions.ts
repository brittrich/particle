import {
  CustomAnswers,
  ConfigOptions,
  ConfigurationAnswers,
  DesignSystemPatternLibraryOptions,
  FrontendFrameworkOptions,
  StaticTestingLibraryOptions,
} from './types'
import inquirer from 'inquirer'

const prompt = inquirer.createPromptModule()

const minMaxOptionsValidate = ({ min, max }: { min: number; max?: number }) => (
  answer: Record<string, string>[]
) => {
  if (answer.length < min || (!max ? false : answer.length > max)) {
    return `You must choose a minimum of ${min} option(s)${
      max ? ` and a maximum of ${max} option(s)` : ''
    }`
  }
  return true
}

const configurationPrompt = (): Promise<ConfigurationAnswers> =>
  prompt([
    {
      type: 'input',
      message: 'choose a project name using kebab case, example: "my-project"',
      name: 'projectName',
      validate: (name: string) => {
        if (!name || name.length < 4) {
          return 'Please enter a project name of more than 4 characters length'
        }
        if (name.indexOf(' ') > 0) {
          return 'Please enter a project name with no spaces'
        }
        return true
      },
    },
    {
      type: 'input',
      message: 'choose a design system name',
      name: 'designSystemName',
      default: 'default',
      validate: (name: string) => {
        if (!name || name.length < 4) {
          return 'Please enter a repo name of more than 4 characters length'
        }
        return true
      },
    },
    {
      type: 'checkbox',
      message: 'Choose a configuration',
      name: 'config',
      choices: [
        {
          name:
            'modern react (storybook, tailwind, react, typescript, jest | cypress, svgs)',
          value: 'modern-react',
        },
        { name: 'drupal only (Pattern Lab, Tailwind, Svgs)', value: 'drupal' },
        { name: 'custom', value: 'custom' },
      ],
      validate: minMaxOptionsValidate({ min: 1, max: 1 }),
    },
  ])

const customPromptOptions = (): Promise<CustomAnswers> => {
  return prompt([
    {
      type: 'checkbox',
      message: 'choose a Component/Pattern Library or a Design System',
      name: 'designSystem',
      choices: [
        new inquirer.Separator('-- Design System choose(1 or both)--'),
        {
          name: 'Storybook',
          value: DesignSystemPatternLibraryOptions.STORYBOOK,
          checked: true,
        },
        {
          name: 'Pattern Lab',
          value: DesignSystemPatternLibraryOptions.PATTERN_LAB,
        },
      ],
      validate: minMaxOptionsValidate({ min: 1 }),
    },
    {
      type: 'checkbox',
      message: 'What frontend framework are you using with Storybook?',
      name: 'frontendFramework',
      choices: [
        {
          name: 'React',
          checked: true,
          value: FrontendFrameworkOptions.REACT,
        },
        {
          name: 'Webcomponents',
          value: FrontendFrameworkOptions.WEBCOMPONENTS,
        },
      ],
      // PR up for docs on inquirer to annotate second param answers https://github.com/SBoudrias/Inquirer.js/pull/936
      filter: (value: FrontendFrameworkOptions[], answers: CustomAnswers) => {
        if (
          answers.designSystem.includes(
            DesignSystemPatternLibraryOptions.PATTERN_LAB
          )
        ) {
          return [FrontendFrameworkOptions.TWIG, ...value]
        }
        return value
        // throw new Error(answers.designSystem)
        // input will { answers, values } as we are modifying the return value in the choices section
      },
      when: (answers: CustomAnswers) => {
        // Checks to see if we enabled typescript previously then asks the prompt
        if (
          new Set(answers.designSystem).has(
            DesignSystemPatternLibraryOptions.STORYBOOK
          )
        ) {
          return true
        }

        // Mutates answers object adds twig to selected choice (does not prompt user)
        answers.frontendFramework = [FrontendFrameworkOptions.TWIG]

        return false
      },
    },
    {
      type: 'checkbox',
      message: 'Choose a CSS library',
      name: 'cssLibrary',
      choices: [
        { name: 'Tailwind', checked: true },
        'Sass',
        { name: 'bootstrap', disabled: true },
      ],
    },
    {
      type: 'checkbox',
      message: '[optional] choose a static typing library',
      name: 'staticTestingLibrary',
      choices: [StaticTestingLibraryOptions.TYPESCRIPT],
    },
    {
      type: 'checkbox',
      message:
        'Do you want ESModule support for typescript? \n -- choose(1 or both): Using both will allow for the best of both worlds but you will have to support bundling ESM for modern browsers and CJS for all other browsers --',
      name: 'Typescript options',
      when: (answer: CustomAnswers) => {
        // Checks to see if we enabled typescript previously then asks the prompt
        if (
          new Set(answer.staticTestingLibrary).has(
            StaticTestingLibraryOptions.TYPESCRIPT
          )
        ) {
          return true
        }
        return false
      },
      choices: [
        new inquirer.Separator(
          '-- choose(1 or both): Using both will allow for the best of both worlds but you will have to support bundling ESM for modern browsers and CJS for all other browsers --'
        ), // TODO perhaps we add this part into the message
        {
          name: 'typescript CJS (all browsers but slower on modern browsers)',
          value: 'cjs',
          checked: true,
        },
        { name: 'typescript ESM (for modern browsers only)', value: 'esm' },
      ],
    },
    {
      type: 'checkbox',
      name: 'Are you using SVGs?',
      choices: [
        { checked: true, name: 'yes', value: true },
        { name: 'no', value: false },
      ],
      validate: minMaxOptionsValidate({ min: 1, max: 1 }),
    },
    {
      type: 'checkbox',
      message: 'What testing libraries do you want to use?',
      name: 'testingLibraries',
      choices: ['Jest', 'Cypress', 'Loki (Storybook only VRT)'],
      validate: minMaxOptionsValidate({ min: 1 }),
    },
  ])
}

/**
 * Returns a promise with a json schema
 * The JSON schema will be used for the create method to generate files based off of the options selected in the prompt
 */
export const generatePromptOptions = async () => {
  const results = await configurationPrompt()
  if (new Set(results.config).has(ConfigOptions.CUSTOM)) {
    return customPromptOptions()
  }

  return Promise.resolve(results)
}
