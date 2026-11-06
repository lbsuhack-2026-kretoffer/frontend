import { Component } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { RefreshCcw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    const { hasError, error } = this.state

    if (hasError) {
      return (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Произошла ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              {error && error.message ? error.message : 'Неизвестная ошибка'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                window.location.reload()
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Обновить страницу
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
