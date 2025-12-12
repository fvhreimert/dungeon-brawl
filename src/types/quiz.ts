export type QuizQuestion = {
  q: string
  a: string
}

export type QuizCategory = {
  name: string
  questions: QuizQuestion[]
}

export type Quiz = {
  displayName: string
  categories: QuizCategory[]
}

export type QuizFile = {
  fileName: string
  displayName: string
}
