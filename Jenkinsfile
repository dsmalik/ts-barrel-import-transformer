pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[url: 'https://github.com/dsmalik/ts-barrel-import-transformer.git']])
            }
        }

        stage('install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('run test') {
            steps {
                sh 'npm test'
            }
        }
    }

}