/**
 * React Error Boundary
 *
 * 자식 컴포넌트에서 에러가 발생하면 전체 앱이 깨지는 것을 방지한다.
 * 에러를 잡아서 대체 UI("에러 발생" 메시지 + 재시도 버튼)를 보여준다.
 *
 * NestJS 비유: @Catch() 글로벌 Exception Filter
 *
 * 주의: Error Boundary는 class 컴포넌트로만 만들 수 있다.
 * React에서 유일하게 class를 써야 하는 경우!
 * (componentDidCatch, getDerivedStateFromError는 함수형에서 지원 안 됨)
 */

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  /** 감싸는 자식 컴포넌트들 */
  readonly children: ReactNode
  /** 에러 발생 시 보여줄 대체 UI (선택적) */
  readonly fallback?: ReactNode
}

interface ErrorBoundaryState {
  /** 에러 발생 여부 */
  readonly hasError: boolean
  /** 에러 메시지 */
  readonly errorMessage: string | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  /**
   * 자식에서 에러 발생 시 호출됨 → 상태를 업데이트하여 대체 UI 표시
   *
   * NestJS 비유: ExceptionFilter의 catch() 메서드
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  /**
   * 에러 로깅 (선택적)
   * 나중에 Sentry 등 에러 추적 서비스 연동 시 여기에 추가
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 프로덕션에서는 에러 추적 서비스로 전송
    // 개발 중에는 콘솔에 출력하지 않음 (coding-style.md 규칙)
    void error
    void errorInfo
  }

  /** 재시도 — 에러 상태를 초기화하여 자식을 다시 렌더링 */
  private readonly handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 그걸 보여줌
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div
          className="bg-white dark:bg-[#1f1f1f] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col items-center justify-center px-6 py-12 text-center min-h-[200px]"
        >
          <div className="text-[40px] mb-4 text-red-400">
            !
          </div>
          <h3 className="text-base mb-2 m-0 text-gray-900 dark:text-neutral-200 font-bold leading-snug">
            문제가 발생했습니다
          </h3>
          <p className="text-[13px] mb-5 m-0 max-w-[280px] text-gray-400 dark:text-neutral-500 leading-snug">
            {this.state.errorMessage ?? '일시적인 오류가 발생했습니다.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-5 py-2 text-[13px] font-medium border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 hover:scale-[1.02] transition-all duration-200 rounded-full"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
