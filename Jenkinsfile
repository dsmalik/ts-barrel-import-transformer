pipeline {
    agent any
    triggers { pollSCM('* * * * *') }
    stages {

        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/dev/integrate_with_jenkins']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/dsmalik/ts-barrel-import-transformer.git']])
            }
        }

        stage('Configure node') {
            steps {
                nodejs('node v18') {
                    sh 'npm --version'
                }
            }
        }

        stage('install dependencies') {
            steps {
                nodejs('node v18') {
                    sh 'npm ci'
                }
            }
        }

        stage('run test') {
            steps {
                nodejs('node v18') {
                    sh 'npx jest --clearCache'
                    sh 'npm test'
                }
            }
        }

    }

}