pipeline {
    agent none

    environment {
        DOCKER_REPO = 'tselot24/tms'
        BACKEND_IMAGE = "${DOCKER_REPO}:backend-${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${DOCKER_REPO}:frontend-${BUILD_NUMBER}"
        LATEST_BACKEND_IMAGE = "${DOCKER_REPO}:backend-latest"
        LATEST_FRONTEND_IMAGE = "${DOCKER_REPO}:frontend-latest"
        DOCKER_CREDENTIALS_ID = 'tselot24_docker'
    }

    stages {
        stage('Clone Repository') {
            agent { label 'master' }
            steps {
                git branch: 'main', url: 'https://github.com/michaelnig1133/TMS/tree/main'
            }
        }

      

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    agent { label 'master' }
                    steps {
                        script {
                            dir('backend') {
                                sh '''
                                    echo "Building Backend Image..."
                                    docker build -t $BACKEND_IMAGE .
                                    docker tag $BACKEND_IMAGE $LATEST_BACKEND_IMAGE
                                    docker images | grep tms
                                '''
                            }
                        }
                    }
                    post {
                        failure {
                            echo 'Backend build failed!'
                            sh 'docker images'
                        }
                    }
                }
                
                stage('Build Frontend') {
                    agent { label 'master' }
                    steps {
                        script {
                            dir('frontend') {
                                sh '''
                                    echo "Building Frontend Image..."
                                    docker build -t $FRONTEND_IMAGE .
                                    docker tag $FRONTEND_IMAGE $LATEST_FRONTEND_IMAGE
                                    docker images | grep tms
                                '''
                            }
                        }
                    }
                    post {
                        failure {
                            echo 'Frontend build failed!'
                            sh 'docker images'
                        }
                    }
                }
            }
        }

       
        stage('Deploy with Docker Compose') {
            agent { label 'master' }
            steps {
                script {
                    sh '''
                        echo "Stopping existing containers..."
                        docker-compose down || true
                        
                        echo "Starting services with docker-compose..."
                        docker-compose up -d
                        
                        echo "Waiting for services to start..."
                        sleep 30
                        
                        echo "Checking running containers..."
                        docker-compose ps
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            agent { label 'master' }
            steps {
                script {
                    sh '''
                        echo "Verifying deployment..."
                        sleep 30
                        docker-compose ps
                        echo "Deployment verification completed"
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution completed.'
        }
        
        success {
            echo 'Pipeline completed successfully!'
        }
        
        failure {
            echo 'Pipeline failed! Please check the logs.'
            sh 'docker-compose ps || true'
        }
    }
}
